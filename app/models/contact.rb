class Contact
  include Mongoid::Document

  # contact: { _id: { u: user_id, n: number }, n: name }

  field :_id, type: Hash

  field :n, as: :name, type: String

  #field '_id.u', as: :user_id, type: BSON::ObjectId TODO

  validates_presence_of :user, :number, :name
  
  before_validation do
    write_attribute :_id, u: user.id, n: number.to_i
  end

  belongs_to :user #, foreign_key: '_id.u' TODO

  attr_writer :number

  def number
    "%d" % (@number || _id['n'] || _id[:n] || read_attribute('_id.n'))
  end
end
