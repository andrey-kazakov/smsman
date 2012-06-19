class Message
  include Mongoid::Document

  belongs_to :mailing

  field :text, type: String, default: ''
  validates_presence_of :text

  has_one :recipients_list, autosave: true
  validates_presence_of :recipients_list

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

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

  def recipients_list
    read_attribute(:recipients_list) || RecipientsList.new
  end

  def enqueue!
    raise InvalidStateException unless mailing
    raise InvalidStateException if mailing.draft?

    sender = mailing.sender.to_s
    body = unicode? ? text.encode("ucs-2be").force_encoding("ascii-8bit") : text.encode("ascii-8bit")
    options = { source_addr_ton: 0, source_addr_npi: 5, data_coding: unicode? ? 8 : 1 }
    method = multipart? ? :send_concat_mt : :send_mt

    recipients_list.each_with_index do |recipient, index|
      message_id = { :recipients_list_id => recipients_list._id, :recipient_index => index }

      Thread.new do
        loop do
          begin
            SmsGateway.tx.send(method, message_id, sender, "+#{recipient.to_s}", body, options)
            break
          rescue InvalidStateException
            sleep 1
          rescue
            RecipientsList.state_callback(message_id, :failed)
            break
          end
        end
      end
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
