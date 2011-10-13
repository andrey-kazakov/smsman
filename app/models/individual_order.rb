class IndividualOrder < Order
  has_many :targets, :class_name => 'IndividualTarget'
end
