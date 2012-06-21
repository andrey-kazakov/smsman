class Message
  include Mongoid::Document

  belongs_to :mailing

  field :text, type: String, default: ''

  has_one :recipients_list, autosave: true
  validates_presence_of :recipients_list

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  def has_recipients?
    recipients_list.present? and !recipients_list.list.empty?
  end

  def draft?
    mailing.present? ? mailing.draft? : true
  end

  def unicode?
    text =~ /[^\u0000-Z_-z]/
  end

  def parts
    #return 0 if text.length < 1

    # establish real message length in octets
    octets = (unicode? ? text.length * 2 : (7.0/8)*text.length).ceil
    
    # 140 octets for whole message, 134 for each part of partial one
    octets <= 140 ? 1 : (octets / 134.0).ceil
  end

  def multipart?
    parts > 1
  end

  def enqueue!
    raise Smpp::InvalidStateException if mailing.draft?

    sender = mailing.sender.to_s
    body = unicode? ? text.encode("ucs-2be").force_encoding("ascii-8bit") : text.encode("ascii-8bit")
    options = { source_addr_ton: 0, source_addr_npi: 5, data_coding: unicode? ? 8 : 1 }
    method = multipart? ? :send_concat_mt : :send_mt

    recipients_list_id = recipients_list._id

    each_recipient = proc do |recipient, index, iter|
      message_id = { :recipients_list_id => recipients_list_id, :recipient_index => index }

      begin
        SmsGateway.tx.send(method, message_id, sender.dup, "+#{recipient['n'].to_s}", body.dup, options.dup)
        iter.next
      rescue Smpp::InvalidStateException
        EventMachine.add_timer(0.25) do
          each_recipient.call(recipient, index, iter)
        end
      rescue
        Smpp::Base.logger.warn $!
        RecipientsList.state_callback(message_id, :failed)
        iter.next
      end
    end

    pending_index = -1
    EventMachine::Iterator.new(recipients_list.list).each do |recipient, iter|
      pending_index = pending_index.next
      each_recipient.call(recipient, pending_index, iter)
    end
  end

protected
  def calc_summary
    summary = Summary.new

    parts.times{ summary.add(recipients_list.summary) } if recipients_list.present?

    write_attribute :summary, summary.serialize(summary)

    warn errors.full_messages
  end
end
