class ApplicationController < ActionController::Base
  protect_from_forgery

protected
  def verify_admin
    redirect_to root_path unless current_user.admin
  end
end
