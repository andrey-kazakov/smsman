class BulkTarget < Target
  belongs_to :bulk_order, :inverse_of => :targets
end
