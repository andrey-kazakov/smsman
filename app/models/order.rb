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
    #raise "order #{id} is not paid" unless paid
    unless accepted
      set :accepted, true

      reload
      Ip2Sms.perform self
    end
  end

  def decline!
    set :accepted, false
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
    return if is_a? SingleOrder
    return unless respond_to? :targets

    if @_targets
      targets.destroy_all

      cost = 0
      @_targets.each do |target|
        klass = target.delete(:_type)
        cost += klass.create(target.merge(:targetable => self)).cost.to_i
      end
      set :cost, cost

      @_targets = nil
    end
  end

end
