module PagesHelper
  def prices_row count, filters
    ret = ''
    ret << '<tr>'
    ret << '<td>' << ('%.00f' % count) << '</td>'

    filters.each_pair do |filter,cost|
      ret << '<td>'

      if current_user
        ret << link_to(('%.02f' % cost), '/robokassa/start?'+RobokassaMerchant.signed_start_params(count, filter, cost, current_user))
      else
        ret << ('%.02f' % cost)
      end

      ret << '</td>'
    end

    ret << '</tr>'
    raw ret
  end
end
