class PagesController < ApplicationController
  include OrdersHelper

  def index
    if current_user.present?
      @orders = orders.order_by case params[:order]
                                    when 'accepted' then :accepted
                                    when 'paid' then :paid
                                    else :created_at
                                end

      render 'orders/index'
    else
      render 'pages/welcome'
    end
  end

  def explore

  end

  def prices

  end

  def contacts

  end

  def faq

  end
end
