module MailingsHelper
  def message_attributes message
    ret = { 
      'id' => "message_#{message._id}",
      'data-parts-amount' => message.parts,
      'data-recipients-amount' => message.summary.total / message.parts
    }

    message.summary.total_by_prefixes.each_pair do |prefix, count|
      ret["data-recipients-amount-#{prefix}"] = count / message.parts
    end

    raw ret.map{ |k,v| %<#{k}="#{v}"> }.join ' '
  end
end
