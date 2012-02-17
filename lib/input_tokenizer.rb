require 'strscan'

module InputTokenizer
  class << self
    RUSSIAN_NUMBERS = /((\+7|8)(\D+)?9(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\Z|[\D]))/
    UKRAIN_NUMBERS = /((\A|[\D])\+38(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\D+)?\d(\Z|[\D]))/

    def parse_numbers input
      numbers = input.scan(RUSSIAN_NUMBERS) + input.scan(UKRAIN_NUMBERS)
      numbers.map do |number|
        number = number.first
        number.gsub! /[^\+\d]/, ''
        number
      end
    end

    def parse_numbers_with_messages input
      ret = {}
      input.each_line do |line|
        line.strip!
        s = StringScanner.new line
        phone = parse_numbers(s).first
        s.skip(/(?:[[:punct:]]|[[:space:]])+/)
        text = s.scan_until(/$/)
        ret[phone] = text
      end
      ret
    end
  end
end
