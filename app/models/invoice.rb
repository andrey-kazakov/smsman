class Invoice
  include Mongoid::Document
  include Mongoid::Timestamps
  include Mongoid::Paranoia

  field :paid, :type => Integer, :default => false
  attr_protected :paid

  field :money_amount, :type => Integer, :default => 0 # amount is in cents!

  field :objects_amount, :type => Integer, :default => 0
  field :objects_filter, :type => String
  validates_presence_of :objects_filter

  referenced_in :user
end
