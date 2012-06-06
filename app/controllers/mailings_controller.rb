class MailingsController < ApplicationController
  before_filter :authenticate_user!

  def new
    @mailing = Mailing.new
  end
end
