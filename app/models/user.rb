class User
  include Mongoid::Document
  include Mongoid::Timestamps
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :orders

  field :first_name, type: String
  field :last_name, type: String
  validates_presence_of :first_name, :last_name

  field :company_name, type: String
  field :phone_number, type: String
  field :referral, type: String

  field :admin, type: Boolean, default: false
  attr_protected :admin

  def full_name
    [first_name, last_name].join " "
  end

  def to_s
    full_name
  end

  def admin!
    write_attribute :admin, true
    save :validate => false
  end

  def not_admin!
    write_attribute :admin, false
    save :validate => false
  end
end
