class RecipientsList
  include Mongoid::Document

  belongs_to :message

  belongs_to :user
  validates_presence_of :user # to allow recipients upload into new mailing

  # [ { n: number, s: state, i: api_id } ]
  field :list, type: Array, default: []

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  def << recipient
    #
  end

  def self.parse recipients
    #
  end

protected
  def calc_summary
    summary = Summary.new

    list.each do |recipient|
      summary.add(recipient[:n], recipient[:s])
    end

    write_attribute :summary, summary.serialize(summary)
  end
end
