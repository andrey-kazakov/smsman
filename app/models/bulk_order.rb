require 'input_tokenizer'

class BulkOrder < Order
  field :text, type: String
  validates_presence_of :text

  has_many :targets, :class_name => 'BulkTarget'
  validates_presence_of :targets

  def recipient_numbers
    targets.map(&:recipient_number).join("\n")
  end

  def recipient_numbers= input
    self.targets = InputTokenizer.parse_numbers(input).map{ |number| BulkTarget.new(:recipient_number => number) }
  end
end
