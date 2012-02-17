module ApplicationHelper
  def link_highlight title, link, *args, &block
    li_class = if parse_uri(link) == parse_uri(request.env['PATH_INFO'])
      'active'
    else
      nil
    end

    content_tag :li, class: li_class do
      if block_given?
        link_to link, *args, &block
      else
        link_to title, link, *args
      end
    end
  end
  
  def parse_uri str
    str.gsub(/\?.*/, '').gsub(/\#.*/, '')
  end
  
  def title
    @@title ||= nil

    if @@title.present?
      "#{@@title} - #{t('title')}"
    else
      t 'title'
    end
  end
  
  def set_title str
    @@title = str if str.present?
  end
  
  def language_toggle
    content_tag :li do
      if I18n.locale == :ru
        %Q{
          #{image_tag '/assets/ukraine.png'}
          #{link_to t('language_toggle'), toggle_language_path}
        }
      else
        %Q{
          #{image_tag '/assets/russia.png'}
          #{link_to t('language_toggle'), toggle_language_path}
        }
      end.html_safe
    end
  end
end
