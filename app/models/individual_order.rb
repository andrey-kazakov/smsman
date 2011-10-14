class IndividualOrder < Order
  has_many :targets, :class_name => 'IndividualTarget'
  validates_presence_of :targets

  def recipient_numbers_with_texts
    targets.map{ |target| "#{target.recipient_number},#{target.text}" }.join("\n")
  end

  def recipient_numbers_with_texts= input
    self.targets = []
    InputTokenizer.parse_numbers_with_messages(input).each_pair do |number, text| 
      targets << IndividualTarget.new(:recipient_number => number, :text => text)
    end
  end
end
