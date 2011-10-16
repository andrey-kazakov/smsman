class BulkTarget < Target
  referenced_in :order, :inverse_of => :targets, :class_name => 'BulkOrder'
  validates_presence_of :bulk_order
end
