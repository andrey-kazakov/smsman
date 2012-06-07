class Summary < ActiveSupport::HashWithIndifferentAccess
  include Mongoid::Fields::Serializable

  prefixes_locale = I18n.t('messages.prefixes')
  PREFIXES = (prefixes_locale.kind_of?(Hash) ? prefixes_locale : {}).keys.sort.freeze
  STATES = [nil, :delivered, :pending, :failed].freeze

  MERGER = proc{ |k,v1,v2| v1 + v2 }.freeze

  def initialize hash = {}
    self[:total_by_prefixes] = Hash[self.class::PREFIXES.map{ |prefix| [prefix, 0] }]

    self[:total_by_prefixes].instance_eval do
      def + obj
        self.merge!(obj, &Summary::MERGER)
      end
    end

    self.class::STATES.each{ |state| self[state] = 0 }

    add(hash || {})
  end

  def method_missing meth
    self[meth]
  end

  def deserialize(object)
    self.class.new(object)
  end

  def serialize(object)
    self.class.new(object)
  end

  def total
    self[:total_by_prefixes].map{ |prefix, amount| amount }.inject(:+) || 0
  rescue
    0
  end

  def empty?
    total.zero?
  end

  def add obj, state = nil
    if obj.kind_of? Summary
      merge!(obj, &Summary::MERGER)
    else
      raise ArgumentError unless self.class::STATES.include? state

      obj = obj.to_s
      
      self[state] += 1 unless state.nil?

      self.class::PREFIXES.each do |prefix|
        if obj =~ /^#{prefix}/
          self[:total_by_prefixes][prefix] += 1
        end
      end
    end

    self
  end
end
