class UsersController < ApplicationController
  before_filter :authenticate_user!
  before_filter :verify_admin, :except => [:update, :profile]

  def index
    @users = User.all
  end
  
  def profile
    @user = current_user
    @orders = @user.orders
    
    render 'show'
  end

  def show
    if current_user.admin
      @user = User.find(params[:id])
      @orders = @user.orders
    else
      redirect_to root_path
    end
  end

  def update
    @user = current_user.admin ? User.find(params[:id]) : current_user

    respond_to do |format|
      if @user.update_attributes(params[:user])
        format.html { redirect_to @user, notice: t('order_updated_notice') }
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
      #FIXME: Что это за php-style код в рельсах?
      format.js{ render :js => %<$('#user_#{@user.id} .admin').text('#{request.delete? ? (@user == current_user ? 'you!' : 'no') : 'yes'}')> }
    end
  end
end
