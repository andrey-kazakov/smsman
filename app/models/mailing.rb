class Mailing
  include Mongoid::Document

  belongs_to :user

  field :sender, type: String
  validates_format_of :sender, with: /\A(?:[[:alpha:]]{,11}|\+\d{,15})\Z/

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  has_many :messages
  attr_protected :messages

protected
  def calc_summary
    self[:summary] = Summary.new

    messages.each{ |message| self[:summary].add(message.summary) }
  end
end
