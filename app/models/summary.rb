class Summary < ActiveSupport::HashWithIndifferentAccess
  include Mongoid::Fields::Serializable

  prefixes_locale = I18n.t('messages.prefixes')
  PREFIXES = (prefixes_locale.kind_of?(Hash) ? prefixes_locale : {}).map{ |prefix, t| prefix }.sort.freeze
  STATES = [nil, :delivered, :pending, :failed].freeze

  def initialize hash = {}
    self[:total_by_prefixes] = Hash[self.class::PREFIXES.map{ |prefix| [prefix, 0] }]

    self.class::STATES.each{ |state| self[state] = 0 }

    add(hash)
  end

  def deserialize(object)
    self.new(object)
  end

  def serialize(object)
    self.new(object)
  end

  def total
    self[:total_by_prefixes].map{ |prefix, amount| amount }.inject(:+) || 0
  end

  def add obj, state = nil
    if obj.kind_of? Summary
      self[:total_by_prefixes].merge!(obj[:total_by_prefixes]){ |k,v1,v2| v1+v2 }

      self.class::STATES.reject{ |v| v.nil? }.each{ |s| self[s] += obj[s] }
    else
      raise ArgumentError unless self.class::STATES.include? state
      
      self[state] += 1 unless state.nil?

      self.class::PREFIXES.each do |prefix|
        if obj =~ /^#{prefix}/
          self[:total_by_prefixes].merge!(prefix => 1){ |k,v1,v2| v1+v2 }
        end
      end
    end

    self
  end
end
