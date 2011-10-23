class Target
  include Mongoid::Document

  field :recipient_number, type: String

  field :api_id, type: String
  field :api_state, type: String

  field :cost, type: Integer

  belongs_to :targetable, :polymorphic => true
end
