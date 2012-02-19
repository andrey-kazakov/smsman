class ApiController < ApplicationController
  before_filter :authenticate_user!
  respond_to :xml

  def create
    input = Nokogiri::XML::Document.parse(request.body).at('order')
    raise 'No `order` element found' unless input

    @order = AutomaticOrder.new name: input['name'], sender_number: input['sender']
    @order.load_messages_from_xml input
    @order.save!

    @order.accept!

    doc = Nokogiri::XML::Document.new
    doc << Nokogiri::XML::Node.new('order', doc)
    @order.put_messages_to_xml doc.at('order')

    render xml: doc
    
  rescue
    do_fail $!
  end

  def do_fail err
    doc = Nokogiri::XML::Document.new
    doc << Nokogiri::XML::Node.new('order', doc)
    doc.at('order').content = err.to_s
    
    response.status = 400
    render xml: doc
  end
end
