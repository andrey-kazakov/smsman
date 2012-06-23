Smpp::Base.logger = Rails.logger

class SmsGateway

  cattr_reader :tx

  def logger
    Smpp::Base.logger
  end

  def start
    @config = YAML::load(File.open(Rails.root + 'config/smpp.yml')) rescue nil

    if @config
      EventMachine::run do             
        @@tx = EventMachine::connect(
          @config[:host], 
          @config[:port], 
          Smpp::Transceiver, 
          @config,
          self    # delegate that will receive callbacks on MOs and DRs and other events
        )     
      end
    end
  end
  
  # ruby-smpp delegate methods 

  def mo_received(transceiver, pdu)
    logger.info "Delegate: mo_received: from #{pdu.source_addr} to #{pdu.destination_addr}: #{pdu.short_message}"
    # and then justt ignore; we don't need to receive MO messages
  end

  def delivery_report_received(transceiver, pdu)
    logger.info "Delegate: delivery_report_received: ref #{pdu.msg_reference} stat #{pdu.stat}"
    RecipientsList.state_callback(nil, :delivered, pdu.msg_reference)
  end

  def message_accepted(transceiver, mt_message_id, pdu)
    logger.info "Delegate: message_accepted: id #{mt_message_id} smsc ref id: #{pdu.message_id}"
    RecipientsList.state_callback(mt_message_id, :pending, pdu.message_id)
  end

  def message_rejected(transceiver, mt_message_id, pdu)
    logger.info "Delegate: message_rejected: id #{mt_message_id} smsc ref id: #{pdu.message_id}"
    RecipientsList.state_callback(mt_message_id, :failed, pdu.message_id)
  end

  def bound(transceiver)
    logger.info "Delegate: transceiver bound"
  end

  def unbound(transceiver)  
    logger.info "Delegate: transceiver unbound"
    EventMachine.add_timer(1){ SmsGateway.new.start }
  end
  
end

# Start the Gateway
EventMachine.next_tick do
#  sleep_time = 1
#  loop do
    begin   
      SmsGateway.new.start
    rescue Exception => ex
      puts "Exception in SMS Gateway: #{ex} at #{ex.backtrace.join("\n")}"
    end
#    sleep(sleep_time = sleep_time.next)
#  end
end
