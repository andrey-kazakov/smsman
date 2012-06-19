class Mailing
  include Mongoid::Document

  belongs_to :user

  field :sender, type: String
  validates_format_of :sender, with: /\A[ -:@-Z_a-z]{1,11}\Z/

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  has_many :messages, autosave: true

  field :sent_at, type: Time
  index :sent_at

  scope :sent, ->{ where(:sent_at.ne => nil) }
  scope :drafts, ->{ where(:sent_at => nil) }

  def created_at
    _id.generation_time
  end

  def draft?
    sent_at.nil?
  end

  def enqueue!
    messages.map(&:enqueue!)
  end


protected
  def calc_summary
    summary = Summary.new

    messages.each{ |message| summary.add(message.summary) }

    write_attribute :summary, summary.serialize(summary)
  end
end
