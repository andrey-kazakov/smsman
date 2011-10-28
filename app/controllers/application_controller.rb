class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter do
    if current_user.present?

    else
      #I18n.locale = extract_locale_from_accept_language_header
      I18n.locale = :ru
    end
  end

protected
  def verify_admin
    redirect_to root_path unless current_user.admin
  end

  def extract_locale_from_accept_language_header
    request.env['HTTP_ACCEPT_LANGUAGE'].scan(/^[a-z]{2}/).first
  end
end
