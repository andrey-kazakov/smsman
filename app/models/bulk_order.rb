class BulkOrder < Order
  field :text, type: String
  validates_presence_of :text

  references_many :targets, :class_name => 'BulkTarget', :autosave => true

  def recipient_numbers
    (@_targets || targets).map{ |t| t[:recipient_number] }.join("\n")
  end

  def recipient_numbers= input
    @_targets = InputTokenizer.parse_numbers(input).map{ |number| { :_type => BulkTarget, :recipient_number => number } }
  end
end
