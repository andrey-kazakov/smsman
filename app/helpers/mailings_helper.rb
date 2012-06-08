# encoding: utf-8
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

  def summary of
    ret  = %<<span>#{t('messages.total')}:\u00a0</span> >

    ret << %<<span class="countries">>

    total_by_prefixes = of.summary.total_by_prefixes.reject{ |k,v| v < 1 }

    total_by_prefixes.keys.each_with_index do |prefix, index|

      ret << %<<span>#{t('messages.prefixes')[prefix]}\u00a0— >

      ret << %<<span>#{total_by_prefixes[prefix]}</span>>
      ret << (index < (total_by_prefixes.size - 1) ? ",\u00a0" : '')

      ret << %<</span>>

    end

    raw ret
  end
end
