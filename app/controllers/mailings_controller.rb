# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!, :except => [:new]

  def new
    return redirect_to welcome_pages_path unless user_signed_in?

    @mailing = Mailing.new
    @mailing.messages.new(text: "Это - тестовое сообщение, и оно обязательно должно быть длиной больше семидесяти символов.", recipients: [79067473526, 389067473526, 79655285838])
  end
end
