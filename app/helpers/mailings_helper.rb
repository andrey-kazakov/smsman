# encoding: utf-8
module MailingsHelper
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

  def states_summary of
    states = Summary::STATES.reject{ |state| of.summary[state] < 1 }.map{ |state| span(typo_number(of.summary[state]) + "\u00a0" + t("messages.count.#{state}", :count => of.summary[state])) }

    states.empty? ? '' : raw(span(t('messages.of_them')) + ' ' + raw(states.join(",\u00a0")) + '.')
  end
end
