class Invoice
  include Mongoid::Document
  include Mongoid::Timestamps
  include Mongoid::Paranoia

  field :amount, :type => Integer, :default => 0 # amount is in cents!
end
