require 'net/http'
require 'nokogiri'

module Ip2Sms
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
