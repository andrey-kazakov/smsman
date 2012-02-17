require 'strscan'

module InputTokenizer
  class << self
    #FIXME: Wtf? If I have only available phone numbers like these: +7 (985) 356 70 16, how I can send it?
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
