class BulkOrder < Order
  field :text, type: String
  validates_presence_of :text

  has_many :targets, :as => :targetable
  #FIXME: Show more informative message
  validates_presence_of :recipient_numbers

  def recipient_numbers
    (@_targets || targets).map{ |t| t[:recipient_number] }.join("\n")
  end

  def recipient_numbers= input
    #FIXME: Frustration! Frustration! Frustration! Why you not saving invalid recipient_numbers for editing if any error exists?
    @_targets = InputTokenizer.parse_numbers(input).map{ |number| { :_type => BulkTarget, :recipient_number => number } }
  end
end
