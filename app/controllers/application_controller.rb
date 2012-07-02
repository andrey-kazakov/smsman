class ApplicationController < ActionController::Base
  protect_from_forgery

  layout :layout_by_resource

  def after_sign_in_path_for resource
    resource.kind_of?(Manager) ? management_index_path : root_path
  end

  def after_sign_out_path_for resource
    manager_signed_in? ? management_index_path : welcome_pages_path
  end

  def layout_by_resource
    if (devise_controller? and resource_name == :manager) or 'management' == params[:controller]
      'management'
    else
      'application'
    end
  end
end
