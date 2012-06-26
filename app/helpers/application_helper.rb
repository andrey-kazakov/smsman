# encoding: utf-8
module ApplicationHelper
  def span content, attributes = {}
    ret  = '<span'

    unless attributes.empty?
      ret << ' '

      ret << raw(attributes.map{ |attribute, value| raw(attribute.to_s + '="' + raw(h(value)) + '"') }.join(' '))
    end

    ret << '>'

    ret << raw(content)

    ret << '</span>'

    raw ret
  end

  def typo_number num
    ret = ""
    num = num.to_s

    num.reverse.scan(/\d{3}/) do
      ret = span('', class: 'thinsp') + $&.reverse + ret
    end

    ret = num[0..(num.length-1)%3] + ret if num.length % 3 != 0 # add the beginning

    raw ret
  end

  def nav_link text, page
    ret  = "<li><a "

    ret << %<class="active" > if current_page? page

    ret << %<href="#{h(page)}">

    ret << "><u>#{h(text)}</u></a></li>"

    raw ret
  end

  def nav_links hash
    raw hash.map{ |t,p| nav_link(t,p) }.join
  end

  def total_by_prefixes of
    total_by_prefixes = of.summary.total_by_prefixes.reject{ |k,v| v < 1 }

    countries = ""
    total_by_prefixes.keys.each_with_index do |prefix, index|
      countries << span(t('messages.prefixes')[prefix] + "\u00a0— " + span(typo_number(total_by_prefixes[prefix]), 'data-prefix' => prefix) + (index < (total_by_prefixes.size - 1) ? ",\u00a0" : ''))
    end

    raw(span(t('messages.total') + ":\u00a0") + span(countries, class: 'countries'))
  end

end
