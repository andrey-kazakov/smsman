require 'digest/md5'

class RobokassaMerchant
  def initialize app, settings
    @app = app
    @settings = settings
  end

  def call env
    if env['PATH_INFO'] =~ /^\/robokassa\//
      params = Hash[env['QUERY_STRING'].split('&').map{ |pair| pair.split('=', 2) }]

      # TODO: можно отрефакторить, т. к. код в целом одинаковый
      case env['PATH_INFO']
      when /result$/ then
        out_sum = params['OutSum']
        inv_id = params['InvId']
        signature_value = params['SignatureValue']
        order_id = params['shpOrderId']

        return [400, {}, []] if [out_sum, inv_id, signature_value, order_id].include? nil

        digest = Digest::MD5.hexdigest("#{out_sum}:#{inv_id}:#{@settings['MerchantPass2']}:shpOrderId=#{order_id}")
  
        return [401, {}, []] unless digest.downcase == signature_value.downcase

        order = Order.find order_id rescue return [404, {}, []]

        return [409, {}, []] if order.paid

        cents = out_sum.gsub(/[^\d]/){}

        return [403, {}, []] if order.cost != cents

        Order.set :paid, true

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
          cents = out_sum.gsub(/[^\d]/){}

          return [403, {}, []] if order.cost != cents

          Order.set :paid, true
        end

        [301, { 'Location' => "/orders/#{order_id}" }, []]
      when /fail$/ then
        order_id = params['shpOrderId']

        [301, { 'Location' => "/orders/#{order_id}" }, []]
      else [404, {}, []]
      end
    else
      @app.call env
    end
  end
end
