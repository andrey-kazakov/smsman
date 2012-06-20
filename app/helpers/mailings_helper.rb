# encoding: utf-8
module MailingsHelper
  def span content, attributes = {}
    ret  = '<span'

    unless attributes.empty?
      ret << ' '

      ret << attributes.map{ |attribute, value| h(attribute) + '=' + h(value) }.join(' ')
    end

    ret << '>'

    ret << content

    ret << '</span>'

    raw ret
  end

  def message_attributes message
    ret = { 
      'id' => "message_#{message._id}",
      'data-parts-amount' => message.parts,
      'data-recipients-amount' => 0
    }

    if message.recipients_list and message.recipients_list.summary
      ret['data-recipients-amount'] = message.recipients_list.summary.total

      message.recipients_list.summary.total_by_prefixes.each_pair do |prefix, count|
        ret["data-recipients-amount-#{prefix}"] = count
      end
    end

    raw ret.map{ |k,v| %<#{k}="#{v}"> }.join ' '
  end

  def total_by_prefixes of
    ret  = %<<span>#{t('messages.total')}:\u00a0</span> >

    ret << %<<span class="countries">>

    total_by_prefixes = of.summary.total_by_prefixes.reject{ |k,v| v < 1 }

    total_by_prefixes.keys.each_with_index do |prefix, index|

      ret << %<<span>#{t('messages.prefixes')[prefix]}\u00a0— >

      ret << %<<span>#{typo_number(total_by_prefixes[prefix])}</span>>
      ret << (index < (total_by_prefixes.size - 1) ? ",\u00a0" : '')

      ret << %<</span>>

    end

    raw ret
  end

  def states_summary of
    states = Summary::STATES.reject{ |state| of.summary[state] < 1 }.map{ |state| span(typo_number(of.summary[state]) + "\u00a0" + t("messages.count.#{state}", :count => of.summary[state])) }

    states.empty? ? '' : raw(span(t('messages.of_them')) + ' ' + raw(states.join(",\u00a0")) + '.')
  end
end
