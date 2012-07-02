class InvoicesController < ApplicationController
  before_filter :authenticate_user!

  def buy
    if manager_signed_in?
      invoice = ManualInvoice.create!({ user_id: current_user }.merge(params))
      
      invoice.user.inc "object_amounts.#{invoice.objects_filter}", invoice.objects_amount
      invoice.set :paid, true

      redirect_to '/'
    else
      redirect_to('/robokassa/start?' + RobokassaMerchant.signed_start_params(params[:objects_amount], params[:objects_filter], params[:objects_amount].to_i * 7, current_user))
    end
  end
end
