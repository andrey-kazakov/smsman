class InvoicesController < ApplicationController
  def buy
    redirect_to('/robokassa/start?' + RobokassaMerchant.signed_start_params(objects_amount, objects_filter, objects_cost, user))
  end
end
