class ManagementController < ApplicationController
  before_filter :authenticate_manager!

  def index
    @users = User.all
  end

  def become_user
    sign_in User.find(params[:id])
    redirect_to root_path
  end

  def quit
    sign_out :manager
    sign_out :user

    redirect_to '/'
  end
end
