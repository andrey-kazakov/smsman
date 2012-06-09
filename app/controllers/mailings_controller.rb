# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!, :except => [:new]

  def sent
    @mailings = current_user.mailings.sent.order(id: :desc).all

    index
  end

  def drafts
    @mailings = current_user.mailings.drafts.order(id: :desc).all

    index
  end

  def index
    render 'index'
  end

  def new_init
    @mailing = current_user.mailings.new
  end

  def show_init
    @mailing = current_user.mailings.find(params[:id])
  end

  def create
    new_init
    do_update
  end

  def update
    show_init
    do_update
  end

  def new
    return redirect_to welcome_pages_path unless user_signed_in?

    new_init
    do_render
  end

  def show
    show_init
    do_render
  end

protected
  def do_render
    return render :head => :not_found unless @mailing

    render 'show'
  end

  def do_update
    return render :head => :not_found unless @mailing

    @mailing.sender = params[:mailing][:sender]

    @mailing.messages.destroy_all

    params[:mailing][:messages].each_pair do |id, msg_data|
      message = @mailing.messages.new

      message.text = msg_data[:text]

      message.recipients = []

      msg_data[:recipients].each_pair do |number, name|
        message.recipients << number.to_i
      end

      message.save
    end

    if @mailing.valid? and params[:commit] == 'send'
      @mailing.sent_at = Time.now

      # TODO
    end

    if @mailing.save
      redirect_to mailing_path(@mailing)
    else
      redirect_to @mailing.draft? ? drafts_mailings_path : sent_mailings_path
    end
  end
end
