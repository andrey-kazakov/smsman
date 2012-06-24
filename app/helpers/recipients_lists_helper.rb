# encoding: utf-8
module RecipientsListsHelper
  def recipients_list_states_summary of
    states = Summary::STATES.reject{ |state| of.summary[state] < 1 }.map do |state|
      raw('<p>' + span(typo_number(of.summary[state]) + "\u00a0" + t("messages.count.#{state}", :count => of.summary[state])) +
        link_to(raw('<u>Скачать файл</u>'), recipients_list_path(of, filter: state.to_s), class: 'load') + '</p>')
    end

    states.empty? ? '' : raw(states.join)
  end
end
