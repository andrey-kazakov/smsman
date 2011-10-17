class IndividualOrder < Order
  has_many :targets, :as => :targetable

  def recipient_numbers_with_texts
    (@_targets || targets).map{ |target| "#{target[:recipient_number]},#{target[:text]}" }.join("\n")
  end

  def recipient_numbers_with_texts= input
    @_targets = []
    InputTokenizer.parse_numbers_with_messages(input).each_pair do |number, text| 
      @_targets << { :_type => IndividualTarget, :recipient_number => number, :text => text }
    end
  end
end
