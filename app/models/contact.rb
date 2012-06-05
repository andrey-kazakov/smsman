class Contact
  include Mongoid::Document

  # contact: { _id: { u: user_id, n: number }, n: name }

  field :_id, type: Hash

  field '_id.u', as: :user_id, type: BSON::ObjectId

  field :n, as: :name, type: String

  validates_presence_of :user, :number
  
  before_validation do
    write_attribute :_id, u: user.id, n: @number
  end

  belongs_to :user
  
  def number= number
    @number = number.to_i
  end

  def number
    "%.0f" % (@number || _id['n'])
  end
end
