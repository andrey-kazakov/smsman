class Order
  include Mongoid::Document

  attr_protected :accepted

  validates_presence_of :name, :sender_number

  field :name, :type => String
  field :accepted, :type => Boolean
  field :sender_number, :type => String
  field :start_at, :type => Time
  field :actual_till, :type => Time

  belongs_to :user, :inverse_of => :orders
  validates_presence_of :user

  def self.types
    { 'single' => SingleOrder, 'bulk' => BulkOrder, 'individual' => IndividualOrder }
  end
end
