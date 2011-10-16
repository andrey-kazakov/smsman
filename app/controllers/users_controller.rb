class UsersController < ApplicationController
  before_filter :authenticate_user!
  before_filter :verify_admin, :except => [:show, :update]

  def index
    @users = User.all
  end

  def show
    @user = current_user.admin ? User.find(params[:id]) : current_user
    @orders = @user.orders
  end

  def update
    @user = current_user.admin ? User.find(params[:id]) : current_user

    respond_to do |format|
      if @user.update_attributes(params[:user])
        format.html { redirect_to @user, notice: 'Order was successfully updated.' }
        format.json { head :ok }
      else
        @orders = @user.orders

        format.html { render action: "show" }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  def admin
    @user = User.find(params[:id])
    request.delete? and @user != current_user ? @user.not_admin! : @user.admin!

    respond_to do |format|
      format.html{ redirect_to users_path }
      format.js{ render :js => %<$('#user_#{@user.id} .admin').text('#{request.delete? ? (@user == current_user ? 'you!' : 'no') : 'yes'}')> }
    end
  end
end
