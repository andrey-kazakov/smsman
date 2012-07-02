# encoding: utf-8
require 'digest/md5'
require 'uri'

class RobokassaMerchant
  class << self
    def signed_start_params objects_amount, objects_filter, objects_cost, user
      hash = {
        'objects_amount' => objects_amount.to_s,
        'objects_filter' => objects_filter.to_s,
        'objects_cost'   => objects_cost.to_s,
        'user_id'        => user.id.to_s,
        'user_token'     => user.attributes.to_s
      }

      hash['user_token'] = Digest::MD5.hexdigest(query('user_token' => Digest::MD5.digest(query(Hash[hash.sort]))))

      query(hash)
    end

    def parse_query string 
      Hash[string.split('&').map{ |pair| pair = pair.split('=', 2); [pair[0], URI.unescape(pair[1])] }]
    end

    def query hash
      hash.keys.map{ |key| [key, URI.escape(hash[key])].join '=' }.join '&'
    end
  end

  def initialize app, settings
    @app = app
    @settings = settings
  end

  def call env
    @env = env

    if env['PATH_INFO'] =~ /^\/robokassa\//
      params = self.class.parse_query env['QUERY_STRING']

      case env['PATH_INFO']
      when /start$/ then
        digest = params.delete('user_token')
        user = User.find(params['user_id'])
        params['user_token'] = user.attributes.to_s

        return [403, {}, []] unless digest == Digest::MD5.hexdigest(self.class.query('user_token' => Digest::MD5.digest(self.class.query(Hash[params.sort]))))

        #order_id = params['order_id']
        #order = Order.find order_id rescue return [404, {}, []]
        
        invoice = RobokassaInvoice.create! :user_id => params['user_id'], :objects_amount => params['objects_amount'], :objects_filter => params['objects_filter'], :money_amount => params['objects_cost']
        invoice_id = invoice.id.to_s

        query = {}

        query['MrchLogin'] = @settings['MerchantLogin']
        query['OutSum'] = invoice.money_amount.cost
        query['InvId'] = '0'
        query['shpInvoiceId'] = invoice_id
        query['SignatureValue'] = Digest::MD5.hexdigest("#{query['MrchLogin']}:#{query['OutSum']}:#{query['InvId']}:#{@settings['MerchantPass1']}:shpInvoiceId=#{invoice_id}") 

        query['InvDesc'] = "#{params['object_amount']} смс #{I18n.t("messages.prefixes.#{invoice[:objects_filter]}")} для #{user.email}"

        query = self.class.query(query)
        
        url = URI.parse(@settings['InitUrl'])
        url.query = (url.query || '') + query

        return [302, { 'Location' => url.to_s }, []]

      when /result$/ then # можно отрефакторить, т. к. код в целом одинаковый
        out_sum = params['OutSum']
        inv_id = params['InvId']
        signature_value = params['SignatureValue']
        invoice_id = params['shpInvoiceId']

        return [400, {}, []] if [out_sum, inv_id, signature_value, invoice_id].include? nil

        digest = Digest::MD5.hexdigest("#{out_sum}:#{inv_id}:#{@settings['MerchantPass2']}:shpInvoiceId=#{invoice_id}")
  
        return [401, {}, []] unless digest.downcase == signature_value.downcase

        invoice = RobokassaInvoice.find invoice_id rescue return [404, {}, []]

        return [409, {}, []] if invoice.paid

        return [403, {}, []] unless invoice.money_amount.cost? out_sum
        invoice.user.inc "object_amounts.#{invoice.objects_filter}", invoice.objects_amount

        invoice.set :paid, true
        invoice.set :robokassa_invoice_id, inv_id.to_i

        return [200, { 'Content-Type' => 'text/plain' }, ["OK#{inv_id}"]]
        
      when /success$/ then
        out_sum = params['OutSum']
        inv_id = params['InvId']
        signature_value = params['SignatureValue']
        invoice_id = params['shpInvoiceId']

        return [400, {}, []] if [out_sum, inv_id, signature_value, invoice_id].include? nil

        digest = Digest::MD5.hexdigest("#{out_sum}:#{inv_id}:#{@settings['MerchantPass1']}:shpInvoiceId=#{invoice_id}")
  
        return [401, {}, []] unless digest.downcase == signature_value.downcase

        invoice = RobokassaInvoice.find invoice_id rescue return [404, {}, []]

        # вполне вероятная ситуация при отсутствии связи между робокассой и сервером
        unless invoice.paid
          return [403, {}, []] unless invoice.money_amount.cost? out_sum
          invoice.user.inc "object_amounts.#{invoice.objects_filter}", invoice.objects_amount

          invoice.set :paid, true
          invoice.set :robokassa_invoice_id, inv_id.to_i
        end

        flash[:notice] = 'Оплата произведена!'

        return [301, { 'Location' => "/users/#{invoice.user_id.to_s}" }, []]

      when /fail$/ then
        invoice_id = params['shpInvoiceId']

        flash[:error] = 'Платёж не удался.'

        return [301, { 'Location' => "/users/#{invoice.user_id.to_s}" }, []]

      else [404, {}, []]
      end
    else
      @app.call env
    end
  end

  def flash
    @env['action_dispatch.request.flash_hash'] = @env['action_dispatch.request.flash_hash'] || ActionDispatch::Flash::FlashHash.new
  end
end
