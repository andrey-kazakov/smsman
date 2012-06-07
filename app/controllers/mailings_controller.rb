# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!, :except => [:new]

  def new
    return redirect_to welcome_pages_path unless user_signed_in?

    @mailing = Mailing.new
  end
end
