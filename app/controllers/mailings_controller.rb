class MailingsController < ApplicationController
  before_filter :authenticate_user!

  def new
    @mailing = Mailing.new
    warn [@mailing.inspect, @mailing.summary.inspect]
  end
end
