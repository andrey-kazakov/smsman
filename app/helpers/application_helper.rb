module ApplicationHelper
  def typo_number num
    ret = ""
    num = num.to_s

    num.reverse.scan(/\d{3}/) do
      ret = %<<span class="thinsp"></span>#{$&.reverse}#{ret}>
    end

    ret = num[0..(num.length-1)%3] + ret if num.length % 3 != 0 # add the beginning

    raw ret
  end

  def nav_link text, page
    ret  = "<li><a "

    ret << %<class="active" > if current_page? page

    ret << %<href="#{h(page)}">

    ret << "><u>#{h(text)}</u></a>"

    raw ret
  end
end
