class Target
  include Mongoid::Document

  field :recipient_number, type: String

  belongs_to :targetable, :polymorphic => true
end
