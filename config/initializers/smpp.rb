Smpp::Base.logger = Rails.logger

class SmsGateway

  cattr_reader :tx

  def logger
    Smpp::Base.logger
  end

  def start
    @config = 
    {
      :host => '93.188.44.12', # 'smpp.qtelecom.ru',
      :port => 8056,
      :system_id => '17896',
      :password => '67048010',
      :system_type => '', # default given according to SMPP 3.4 Spec
      :interface_version => 52,
      :source_ton  => 0,
      :source_npi => 1,
      :destination_ton => 1,
      :destination_npi => 1,
      :source_address_range => '',
      :destination_address_range => '',
      :enquire_link_delay_secs => 10
    }
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
  
  # ruby-smpp delegate methods 

  def mo_received(transceiver, pdu)
    logger.info "Delegate: mo_received: from #{pdu.source_addr} to #{pdu.destination_addr}: #{pdu.short_message}"
  end

  def delivery_report_received(transceiver, pdu)
    logger.info "Delegate: delivery_report_received: ref #{pdu.msg_reference} stat #{pdu.stat}"
  end

  def message_accepted(transceiver, mt_message_id, pdu)
    logger.info "Delegate: message_accepted: id #{mt_message_id} smsc ref id: #{pdu.message_id}"
  end

  def message_rejected(transceiver, mt_message_id, pdu)
    logger.info "Delegate: message_rejected: id #{mt_message_id} smsc ref id: #{pdu.message_id}"
  end

  def bound(transceiver)
    logger.info "Delegate: transceiver bound"
  end

  def unbound(transceiver)  
    logger.info "Delegate: transceiver unbound"
    sleep 1
    start
  end
  
end

# Start the Gateway
Thread.new do
  loop do
    begin   
      SmsGateway.new.start
    rescue Exception => ex
      puts "Exception in SMS Gateway: #{ex} at #{ex.backtrace.join("\n")}"
    end
  end
end
