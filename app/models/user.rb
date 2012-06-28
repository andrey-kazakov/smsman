class User
  include Mongoid::Document
  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  #before_validation ->{ self.password_confirmation = self.password  }

  ## Database authenticatable
  field :email,              :type => String, :null => false, :default => ""
  field :encrypted_password, :type => String, :null => false, :default => ""

  ## Recoverable
  field :reset_password_token,   :type => String
  field :reset_password_sent_at, :type => Time

  # filtering method: /^\+#{filter}\d{10}$/
  field :object_amounts, type: Hash, default: {} # "filter" => count
  attr_protected :object_amounts

  ## Rememberable
  field :remember_created_at, :type => Time

  ## Trackable
  field :sign_in_count,      :type => Integer, :default => 0
  field :current_sign_in_at, :type => Time
  field :last_sign_in_at,    :type => Time
  field :current_sign_in_ip, :type => String
  field :last_sign_in_ip,    :type => String

  def amount_for number, increment = 0
    # перебираем пары, отсортировав по убыванию длины ключа
    object_amounts.sort{ |a,b| -(a[0].length <=> b[0].length) }.each do |filter,v|
      next unless number.index("+#{filter}") == 0 or number.index("#{filter}") == 0
        
      if increment != 0
        inc "object_amounts.#{filter}", increment
      end

      return v
    end

    0
  end

  ## Encryptable
  # field :password_salt, :type => String

  ## Confirmable
  # field :confirmation_token,   :type => String
  # field :confirmed_at,         :type => Time
  # field :confirmation_sent_at, :type => Time
  # field :unconfirmed_email,    :type => String # Only if using reconfirmable

  ## Lockable
  # field :failed_attempts, :type => Integer, :default => 0 # Only if lock strategy is :failed_attempts
  # field :unlock_token,    :type => String # Only if unlock strategy is :email or :both
  # field :locked_at,       :type => Time

  ## Token authenticatable
  # field :authentication_token, :type => String

  has_many :contacts

  has_many :mailings

  has_many :recipients_lists
end
