class AutomaticOrder < IndividualOrder
  def load_messages_from_xml input
    @_targets ||= []

    input.search('message').each do |message|
      @_targets << { :_type => AutomaticTarget, :recipient_number => message['recipient'], :text => message.content }
    end
  end

  def put_messages_to_xml output
    targets.each do |target|
      message = Nokogiri::XML::Node.new('message', output.document)

      message['id'] = target.id.to_s
      message['recipient'] = target.recipient_number
      message['status'] = target.api_state_id

      message.content = target.api_state unless target.api_state_id == 0

      output << message
    end
  end
end
