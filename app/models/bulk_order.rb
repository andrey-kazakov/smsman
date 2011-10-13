class BulkOrder < Order
  field :text, type: String, :validate => true

  has_many :targets, :class_name => 'BulkTarget'
end
