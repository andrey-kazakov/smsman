class RecipientsList
  include Mongoid::Document

  belongs_to :message

  belongs_to :user
  validates_presence_of :user # to allow recipients upload into new mailing

  field :summary, type: Summary

  def << recipient
    #
  end

  def self.parse recipients
    #
  end
end
