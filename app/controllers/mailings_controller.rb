# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!, :except => [:new]

  def new
    return redirect_to welcome_pages_path unless user_signed_in?

    @mailing = Mailing.new

    render 'show'
  end

  def show
    @mailing = current_user.mailings.find(params[:mailing_id])

    return render :head => :not_found unless @mailing
  end

  def create
    new
    do_update
  end

  def update
    show
    do_update
  end

protected
  def do_update
    messages = params[:mailing].delete :messages
    @mailing.update_attributes(params[:mailing])

    if @mailing.save
      redirect_to show_mailing_path(@mailing)
    else
      redirect_to mailings_path
    end
  end
end
