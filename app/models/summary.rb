class Summary
  include Mongoid::Fields::Serializable

  prefixes_locale = I18n.t('messages.prefixes')
  PREFIXES = (prefixes_locale.kind_of?(Hash) ? prefixes_locale : {}).keys.map(&:to_sym).freeze

  STATES = [:delivered, :pending, :failed].freeze

  MERGER = proc{ |k,v1,v2| v1 + v2 }.freeze

  attr_accessor :total_by_prefixes

  STATES.each{ |s| attr_accessor s }

  def initialize object = nil
    object ||= {}

    @total_by_prefixes = Hash[self.class::PREFIXES.map{ |prefix| [prefix, (object[:total_by_prefixes] && object[:total_by_prefixes][prefix]) || 0] }]

    @total_by_prefixes.instance_eval do
      def + obj
        merge!(obj, &Summary::MERGER)
      end
    end

    self.class::STATES.each{ |state| self.null(state, object[state] || 0) }
  end

  def method_missing meth
    self[meth]
  end

  def deserialize(object)
    self.class.new(object)
  end

  def serialize(object)
    ret = { total_by_prefixes: object[:total_by_prefixes] }

    self.class::STATES.each{ |s| ret[s] = object[s] }

    ret
  end

  def null key, with = 0
    key = :"#{key}="

    send key, with if respond_to? key
  end

  def [] key
    send key if respond_to? key
  end

  def []= key, value, &block
    value = self.class::MERGER.call(key, self[key], value) if self[key]

    key = :"#{key}="

    send key, value if respond_to? key
  end

  def total
    @total_by_prefixes.map{ |prefix, amount| amount }.inject(:+) || 0
  rescue
    0
  end

  def empty?
    total.zero?
  end

  def == obj
    obj.total == total && self.class::STATES.map{ |s| self[s] == obj[s]  }.inject(:&)
  end

  def add obj, state = nil
    if obj.kind_of? self.class
      self[:total_by_prefixes] = obj.total_by_prefixes

      self.class::STATES.each{ |s| self[s] = obj[s] }
    else
      raise ArgumentError unless ([nil] + self.class::STATES).include? state

      obj = obj.to_s
      
      self[state] = 1 unless state.nil?

      self.class::PREFIXES.each do |prefix|
        if obj =~ /^#{prefix}/
          @total_by_prefixes[prefix.to_sym] += 1
        end
      end
    end

    self
  end
end
