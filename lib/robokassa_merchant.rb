require 'digest/md5'
require 'uri'

class RobokassaMerchant
  def initialize app, settings
    @app = app
    @settings = settings
  end

  def call env
    @env = env

    if env['PATH_INFO'] =~ /^\/robokassa\//
      params = Hash[env['QUERY_STRING'].split('&').map{ |pair| pair = pair.split('=', 2); [pair[0], URI.unescape(pair[1])] }]

      case env['PATH_INFO']
      when /start$/ then
        order_id = params['order_id']
        order = Order.find order_id rescue return [404, {}, []]

        query = {}

        query['MrchLogin'] = @settings['MerchantLogin']
        query['OutSum'] = order.cost_string
        query['InvId'] = '0'
        query['SignatureValue'] = Digest::MD5.hexdigest("#{query['MrchLogin']}:#{query['OutSum']}:#{query['InvId']}:#{@settings['MerchantPass1']}:shpOrderId=#{order_id}") 

        query['InvDesc'] = order.name
        query['shpOrderId'] = order_id

        query = query.keys.map{ |key| [key, URI.escape(query[key])].join '=' }.join '&'
        
        url = URI.parse(@settings['InitUrl'])
        url.query = (url.query || '') + query

        return [302, { 'Location' => url.to_s }, []]

      when /result$/ then # можно отрефакторить, т. к. код в целом одинаковый
        out_sum = params['OutSum']
        inv_id = params['InvId']
        signature_value = params['SignatureValue']
        order_id = params['shpOrderId']

        return [400, {}, []] if [out_sum, inv_id, signature_value, order_id].include? nil

        digest = Digest::MD5.hexdigest("#{out_sum}:#{inv_id}:#{@settings['MerchantPass2']}:shpOrderId=#{order_id}")
  
        return [401, {}, []] unless digest.downcase == signature_value.downcase

        order = Order.find order_id rescue return [404, {}, []]

        return [409, {}, []] if order.paid

        return [403, {}, []] unless order.cost? out_sum

        order.set :paid, true

        return [200, { 'Content-Type' => 'text/plain' }, ["OK#{inv_id}"]]
        
      when /success$/ then
        out_sum = params['OutSum']
        inv_id = params['InvId']
        signature_value = params['SignatureValue']
        order_id = params['shpOrderId']

        return [400, {}, []] if [out_sum, inv_id, signature_value, order_id].include? nil

        digest = Digest::MD5.hexdigest("#{out_sum}:#{inv_id}:#{@settings['MerchantPass1']}:shpOrderId=#{order_id}")
  
        return [401, {}, []] unless digest.downcase == signature_value.downcase

        order = Order.find order_id rescue return [404, {}, []]

        # вполне вероятная ситуация при отсутствии связи между робокассой и сервером
        unless order.paid
          return [403, {}, []] unless order.cost? out_sum

          order.set :paid, true
        end

        flash[:notice] = 'Order has been paid successfully!'

        return [301, { 'Location' => "/orders/#{order_id}" }, []]

      when /fail$/ then
        order_id = params['shpOrderId']

        flash[:error] = 'Your payment failed.'

        return [301, { 'Location' => "/orders/#{order_id}" }, []]

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
