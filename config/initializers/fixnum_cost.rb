Fixnum.class_eval do
  class << self
    def cents value
      value = value.to_s.strip
      return 0 unless value =~ /^(\d*\.)?\d+$/
      cost(value).gsub(/[^\d]/){}.to_i
    end

    def cost value
      "%01.02f" % value.to_s.strip
    end
  end

  def cost? value
    cost == self.class.cost(value)
  end

  def cost
    self.class.cost(self / 100.0)
  end
end
