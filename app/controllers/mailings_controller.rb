# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!

  def new
    @mailing = Mailing.new
    @mailing.messages.new(text: "Это - тестовое сообщение, и оно обязательно должно быть длиной больше семидесяти символов.", recipients: [79067473526, 389067473526, 79655285838])
  end
end
