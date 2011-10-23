class Order
  include Mongoid::Document
  include Mongoid::Timestamps

  attr_protected :accepted
  after_save :save_targets

  validates_presence_of :name, :sender_number

  field :name, :type => String
  field :accepted, :type => Boolean
  field :sender_number, :type => String

  index :accepted

  field :api_id, type: String
  field :api_state, type: String

  index :api_id

  belongs_to :user, :inverse_of => :orders
  validates_presence_of :user

  attr_protected :paid
  attr_protected :cost
  field :paid, type: Boolean
  field :cost, type: Integer

  index :paid

  def self.types
    { 'single' => SingleOrder, 'bulk' => BulkOrder, 'individual' => IndividualOrder }
  end

  def accept!
    raise "order #{id} is not paid" unless paid

    unless accepted
      write_attribute(:accepted, true)
      save :validate => false

      reload
      Ip2Sms.perform self
    end
  end

  def decline!
    write_attribute(:accepted, false)
    save :validate => false
  end

  def normalize_cost value
    "%01.02f" % value
  end

  def cost? value
    cost_string == normalize_cost(value)
  end

  def cost_string
    normalize_cost(cost / 100.0)
  end

  def cost
    read_attribute(:cost).to_i
  end

private
  def save_targets
    return unless respond_to? :targets

    if @_targets
      targets.destroy_all

      @_targets.each do |target|
        klass = target.delete(:_type)
        klass.create(target.merge(:targetable => self))
      end
      @_targets = nil
    end
  end

end
