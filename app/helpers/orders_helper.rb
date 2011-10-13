module OrdersHelper
  def method_missing *args, &block
    if args.shift.to_s =~ /order_(url|path)$/
      order_url *args, &block
    else
      super *args, &block
    end
  end
end
