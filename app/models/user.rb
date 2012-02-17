class User
  include Mongoid::Document
  include Mongoid::Timestamps

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :orders
  references_many :invoices

  field :first_name, type: String
  field :last_name, type: String
  field :company_name, type: String
  field :phone_number, type: String
  field :manager, type: Boolean, default: false
  field :referral, type: String
  field :admin, type: Boolean, default: false
  # field :locale, type: String, length: 2

  # filtering method: /^\+#{filter}\d{10}$/
  field :object_amounts, type: Hash, default: {} # "filter" => count
  attr_protected :object_amounts

  attr_protected :admin
  attr_reader :manager_id
  
  validates_presence_of :first_name, :last_name

  before_save do
    if password.present?
      password_confirmation = password
    end
  end

  def amount_for number
    # перебираем пары, отсортировав по убыванию длины ключа
    object_amounts.sort{ |a,b| -(a[0].length <=> b[0].length) }.each do |k,v|
      return v if number.index("+#{filter}") == 0
    end

    0
  end
   
  def manager_id= id
  end

  def full_name
    [first_name, last_name].join " "
  end

  def to_s
    full_name
  end

  def admin!
    set :admin, true
  end

  def not_admin!
    set :admin, false
  end
end
