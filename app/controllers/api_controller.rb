class ApiController < ApplicationController
  before_filter :authenticate_user!
  respond_to :xml

  def create
    input = Nokogiri::XML::Document.parse(request.body).at('order')
    raise 'No `order` element found' unless input

    @order = AutomaticOrder.new name: input['name'], sender_number: input['sender']
    current_user.orders << @order
    @order.load_messages_from_xml input
    @order.save!

    @order.accept!

    doc = Nokogiri::XML::Document.new
    doc.encoding = 'utf-8'

    doc << Nokogiri::XML::Node.new('order', doc)
    doc.at('order')['id'] = @order.id.to_s
    @order.explain_messages_to_xml doc.at('order')

    render xml: doc
    
  rescue
    do_fail $!
  end

  def status
    input = Nokogiri::XML::Document.parse(request.body).at('request')
    raise 'No `request` element found' unless input

    targets = if input['order_id'].nil?
               Target.any_of(input.search('id').map{ |node| { _id: node.content } })
             else
               Order.find(input['order_id']).targets
             end

    raise 'No messages found' if targets.empty?

    Ip2Sms.check_statuses targets

    doc = Nokogiri::XML::Document.new
    doc.encoding = 'utf-8'

    doc << Nokogiri::XML::Node.new('response', doc)

    targets.each{ |t| t.to_xml_node doc.at('response'), false }

    render xml: doc

  rescue
    do_fail $!
  end

  def do_fail err
    doc = Nokogiri::XML::Document.new
    doc.encoding = 'utf-8'

    doc << Nokogiri::XML::Node.new('errors', doc)
    doc.at('errors') << Nokogiri::XML::Node.new('error', doc)
    doc.at('error').content = err.to_s
    
    response.status = 400
    render xml: doc
  end
end
