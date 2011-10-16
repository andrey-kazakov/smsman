class IndividualTarget < Target
  field :text, type: String

  referenced_in :order, :inverse_of => :targets, :class_name => 'IndividualOrder'
  validates_presence_of :order
end
