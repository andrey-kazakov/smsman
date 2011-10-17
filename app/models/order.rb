class Order
  include Mongoid::Document
  include Mongoid::Timestamps

  attr_protected :accepted
  after_save :save_targets

  validates_presence_of :name, :sender_number

  field :name, :type => String
  field :accepted, :type => Boolean
  field :sender_number, :type => String

  belongs_to :user, :inverse_of => :orders
  validates_presence_of :user

  def self.types
    { 'single' => SingleOrder, 'bulk' => BulkOrder, 'individual' => IndividualOrder }
  end

  def accept!
    write_attribute(:accepted, true)
    save :validate => false
  end

  def decline!
    write_attribute(:accepted, false)
    save :validate => false
  end

private
  def save_targets
    return unless respond_to? :targets

    if @_targets
      targets.destroy_all

      @_targets.each do |target|
        targets << target[:_type].new(target)
      end
      @_targets = nil

      save!
    end
  end

end
