class SingleOrder < Order
  field :api_id, type: String
  field :api_state_id, type: Integer
  field :api_state, type: String

  index :api_id
  index :api_state_id

  field :recipient_number, type: String
  field :text, type: String
end
