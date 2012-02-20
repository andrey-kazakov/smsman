class AutomaticOrder < IndividualOrder
  def load_messages_from_xml input
    @_targets ||= []

    input.search('message').each do |message|
      @_targets << { _type: AutomaticTarget, recipient_number: message['recipient'], text: message.content }
    end
  end

  def explain_messages_to_xml output
    targets.each do |target|
      target.to_xml_node output, true
    end
  end
end
