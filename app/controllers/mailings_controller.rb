# encoding: utf-8
class MailingsController < ApplicationController
  before_filter :authenticate_user!, :except => [:new]

  def sent
    @mailings = current_user.mailings.sent.order(_id: :desc).all

    index
  end

  def drafts
    @mailings = current_user.mailings.drafts.order(_id: :desc).all 
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
    # bit of strange behaviour, but register user here

    if params[:user] and params[:user][:email].present?
      email = params[:user][:email].presence

      if User.where(email: email).count > 0

        redirect_to welcome_pages_path

      else
        generated_password = Devise.friendly_token.first(6)

        user = User.create!(:email => email, 
                            :password => generated_password)

        #RegistrationMailer.welcome(user, generated_password).deliver

        sign_in(:user, user)

        redirect_to root_path
      end

      return
    end

    #####
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
      if msg_data[:recipients].present?
        RecipientsList.parse(@mailing.messages.new(text: msg_data[:text]), current_user, msg_data[:recipients].map{ |number, name| number })
      else
        @mailing.messages.new(text: msg_data[:text], recipients_list: RecipientsList.find(msg_data[:recipients_list_id]))
      end
    end

    if @mailing.valid? and params[:commit] == 'send'
      @mailing.sent_at = Time.now
    end

    if @mailing.save
      @mailing.enqueue! unless @mailing.draft?

      redirect_to mailing_path(@mailing)
    else
      warn @mailing.errors.full_messages

      redirect_to @mailing.draft? ? drafts_mailings_path : sent_mailings_path
    end

  end
end
