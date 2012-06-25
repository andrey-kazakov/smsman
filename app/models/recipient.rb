class Recipient
  include Mongoid::Document

  belongs_to :recipients_list
  validates_presence_of :recipients_list

  field :n, type: Integer
  index [:recipients_list_id, :n]
  validates_presence_of :n

  field :s, type: Symbol
  index [:recipients_list_id, :s]

  field :i, type: Integer, default: 0
  index :i

end
