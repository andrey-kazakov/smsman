class IndividualTarget < Target
  field :text, type: String

  belongs_to :individual_order, :inverse_of => :targets
end
