class Order
  include Mongoid::Document

  attr_protected :accepted

  field :name, :type => String, :validate => true
  field :accepted, :type => Boolean
  field :sender_number, :type => String, :validate => true
  field :start_at, :type => Time
  field :actual_till, :type => Time

  belongs_to :user, :inverse_of => :orders

  def self.types
    { 'single' => SingleOrder, 'bulk' => BulkOrder, 'individual' => IndividualOrder }
  end
end
