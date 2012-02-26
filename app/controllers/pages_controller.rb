class PagesController < ApplicationController
  include OrdersHelper
  include PagesHelper

  def index
    if current_user.present?
      @orders = orders.order_by case params[:order]
                                    when 'accepted' then :accepted
                                    when 'paid' then :paid
                                    else [:created_at, :desc]
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
