class InvoicesController < ApplicationController
  def buy
    redirect_to('/robokassa/start?' + RobokassaMerchant.signed_start_params(params[:objects_amount], params[:objects_filter], params[:objects_amount].to_i * 7, current_user))
  end
end
