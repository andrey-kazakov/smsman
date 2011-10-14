require 'strscan'

module InputTokenizer
  class << self
    PHONE_REGEX = /\+\d{10,}/

    def parse_numbers input 
      input.scan(PHONE_REGEX)
    end

    def parse_numbers_with_messages input
      ret = {}
      input.each_line do |line|
        line.strip!
        s = StringScanner.new(line)
        phone = s.scan(PHONE_REGEX)
        s.skip(/(?:[[:punct:]]|[[:space:]])+/)
        text = s.scan_until(/$/)
        ret[phone] = text
      end
      ret
    end
  end
end
