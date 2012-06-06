class Mailing
  class Summary
    include Mongoid::Document

    field :total_by_prefixes, type: Hash

    field :delivered, type: Fixnum, default: 0
    field :pending  , type: Fixnum, default: 0
    field :failed   , type: Fixnum, default: 0

    embedded_in :mailing
  end

  include Mongoid::Document

  belongs_to :user

  field :sender, type: String
  validates_format_of :sender, with: /\A(?:[[:alpha:]]{,11}|\+\d{,15})\Z/

  field :text, type: String
  validates_presence_of :text

  embeds_one :summary
  validates_presence_of :summary
end
