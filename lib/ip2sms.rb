require 'net/http'
require 'nokogiri'

module Ip2Sms
  class << self
    GATEWAY_URL = 'http://service.qtelecom.ru/public/http/z.php'
    GATEWAY_LOGIN = '17896'
    GATEWAY_PASSWORD = '67048010'
    GATEWAY_MSG_PER_REQ = 250

    def query xml
      uri = URI.parse(GATEWAY_URL)
      xml = xml.to_s

      req = Net::HTTP::Post.new uri.path
      req.basic_auth GATEWAY_LOGIN, GATEWAY_PASSWORD
      req.body = xml
      req.content_length = xml.length
      req.content_type = 'text/xml'

      raw = Net::HTTP.new(uri.host, uri.port).start{ |http| http.request(req).body }

      Nokogiri::XML(raw).at('xml_result') rescue raise raw
    end

    def perform order
      xml_for(order) do |xml|
        result = query xml

        result.search('push').each do |push|
          target = case order
                   when SingleOrder then order
                   else order.targets.find push['sms_id']
                   end

          next unless target

          target.api_id       = push['push_id']
          target.api_state_id = push['res'].to_i

          target.api_state = target.api_state_id == 0 ? "OK" : push['description']

          target.save :validate => false
        end

      end
    end

    def check_statuses targets
      iterate_targets_for targets do |current|
        req = xml_request 'sms_status2'

        current.each do |target|
          sms = Nokogiri::XML::Node.new('sms', req.document)
          sms['push_id'] = target.api_id
          req << sms
        end

        result = query req.document

        current.each do |target|
          push = result.at(%<sms[push_id="#{target.api_id}"]>)
          next unless push

          target.api_state_id = push['status'].to_i
          target.api_state    = push['description']

          target.save :validate => false
        end
      end
    end

    def iterate_targets_for collection, &block
      requests = (collection.count.to_f / GATEWAY_MSG_PER_REQ).ceil rescue 1

      requests.times do |i|
        skip = i * GATEWAY_MSG_PER_REQ

        targets = case collection
                  when Array then collection[skip..GATEWAY_MSG_PER_REQ]
                  else collection.skip(skip).limit(GATEWAY_MSG_PER_REQ)
                  end

        yield targets
      end
    end

    def xml_request name
      doc = Nokogiri::XML::Document.new
      doc.encoding = 'utf-8'

      request = Nokogiri::XML::Node.new('xml_request', doc)
      request['name'] = name
      doc << request

      credentials = Nokogiri::XML::Node.new('xml_user', doc)
      credentials['lgn'] = GATEWAY_LOGIN
      credentials['pwd'] = GATEWAY_PASSWORD
      request << credentials

      request
    end

    def xml_for order, &block
      raise 'please pass a block to Ip2Sms.xml_for' unless block_given?

      iterate_targets_for order.targets do |targets|
        request = xml_request 'sms_send'

        targets.each do |target|
          sms = Nokogiri::XML::Node.new('sms', request.document)

          sms['sms_id'] = target.id.to_s
          sms['number'] = target[:recipient_number] || order[:recipient_number]
          sms['source_number'] = order.sender_number

          sms.content = target[:text] || order[:text]

          request << sms
        end
        
        yield request.document
      end
    end
  end
end

=begin
module Old_Ip2Sms
  class << self
    GATEWAY_URL = 'http://bulk.bs-group.com.ua/clients.php'
    GATEWAY_LOGIN = 'HotSpot'
    GATEWAY_PASSWORD = 'HotSpot@sms'

    def perform order
      uri = URI.parse(GATEWAY_URL)
      xml = xml_for(order).to_s
      req = Net::HTTP::Post.new uri.path
      req.basic_auth GATEWAY_LOGIN, GATEWAY_PASSWORD
      req.body = xml
      req.content_length = xml.length
      req.content_type = 'text/xml'

      raw = Net::HTTP.new(uri.host, uri.port).start{ |http| http.request(req).body }

      status = Nokogiri::XML(raw).at('status') rescue nil
      raise raw unless status

      case order
      when SingleOrder
        order.api_id = status['id'] || status.at('id').text rescue nil
        state = status.at('state')
        order.api_state = state.text
        order.api_state += (": #{state['error']}" if state['error']) rescue ''

        order.save :validate => false

      when BulkOrder, IndividualOrder
        order.api_id = status['groupid'] || status['id']
        ids = status.search('id')
        states = status.search('state')

        if states.count == 1
          state = states.first

          order.api_state = state.text rescue nil
          order.api_state += (": #{state['error']}" if state['error']) rescue ''
        else
          order.targets.count.times do |i|
            target = order.targets[i]

            target.api_id = ids[i].text rescue nil
            target.api_state = states[i].text rescue nil
            target.api_state += (": #{states[i]['error']}" if states[i]['error']) rescue ''

            target.save :validate => false
          end
        end
          
        order.save :validate => false

      end

      raw
    end

    def xml_for order
      doc = Nokogiri::XML::Document.new

      message = Nokogiri::XML::Node.new('message', doc)

      service = Nokogiri::XML::Node.new('service', doc)
      service['id'] = Order.types.invert[order.class]
      service['source'] = order.sender_number
      
      case order
      when SingleOrder
        to = Nokogiri::XML::Node.new('to', doc)
        to.content = order.recipient_number
        message.add_child to

        body = Nokogiri::XML::Node.new('body', doc)
        body['content-type'] = 'text/plain'
        body['encoding'] = 'utf-8'
        body.content = order.text
        message.add_child body

      when BulkOrder
        order.targets.each do |target|
          to = Nokogiri::XML::Node.new('to', doc)
          to.content = target.recipient_number
          message.add_child to
        end

        body = Nokogiri::XML::Node.new('body', doc)
        body['content-type'] = 'text/plain'
        body['encoding'] = 'utf-8'
        body.content = order.text
        message.add_child body

      when IndividualOrder
        order.targets.each do |target|
          to = Nokogiri::XML::Node.new('to', doc)
          to.content = target.recipient_number
          message.add_child to
          
          body = Nokogiri::XML::Node.new('body', doc)
          body['content-type'] = 'text/plain'
          body['encoding'] = 'utf-8'
          body.content = target.text
          message.add_child body
        end

      end

      message.add_child service

      doc.add_child message
      doc
    end
  end
end
=end
