class Message
  include Mongoid::Document

  belongs_to :mailing

  field :text, type: String
  validates_presence_of :text

  field :recipients, type: Array # TODO
  validates_presence_of :recipients

  field :summary, type: Summary
  after_initialize :calc_summary
  after_validation :calc_summary

  def parts
    return 0 if text.presence.length < 1

    is_septets = text =~ /\A[\u0000-\u007f]*\Z/
    # establish real message length in octets
    octets = (is_septets ? (7.0/8)*text.length : text.length*2).ceil
    
    # 140 octets for whole message, 134 for each part of partial one
    octets <= 140 ? 1 : (octets / 134.0).ceil
  end

protected
  def calc_summary
    self[:summary] = Summary.new

    recipients.each{ |r| parts.times{ self[:summary].add(r) } }

  end
end
