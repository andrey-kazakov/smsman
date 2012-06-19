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

  def recipients_list
    read_attribute(:recipients_list) || RecipientsList.new
  end

protected
  def calc_summary
    summary = Summary.new

    parts.times{ summary.add(recipients_list.summary) } if recipients_list.present?

    write_attribute :summary, summary.serialize(summary)

    #warn errors.full_messages
  end
end
