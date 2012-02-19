class Target
  include Mongoid::Document

  field :recipient_number, type: String

  field :api_id, type: String
  field :api_state_id, type: Integer
  field :api_state, type: String

  index :api_id
  index :api_state_id

  field :cost, type: Integer

  belongs_to :targetable, :polymorphic => true
end
