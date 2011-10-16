module OrdersHelper
  def orders
    current_user.admin ? Order.all : current_user.orders.all
  end

  def method_missing *args, &block
    forward = args.dup
    case forward.shift.to_s
    when /order_(url|path)$/ then order_url *forward, &block
    when /orders_(url|path)$/ then orders_url *forward, &block
    else super *args, &block
    end
  end
end
