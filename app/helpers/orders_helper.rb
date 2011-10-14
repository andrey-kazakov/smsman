module OrdersHelper
  def method_missing *args, &block
    case args.shift.to_s
    when /order_(url|path)$/ then order_url *args, &block
    when /orders_(url|path)$/ then orders_url *args, &block
    else super *args, &block
    end
  end
end
