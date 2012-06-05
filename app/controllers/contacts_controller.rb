class ContactsController < ApplicationController
  before_filter :authenticate_user!

  respond_to :json

  def index
    render :json => Hash[current_user.contacts.map{ |c| [c.number, c. name] }]
  end

  def create
    states = {}

    request.request_parameters.each_pair do |number, name|
      next unless name.present? and number.presence.match(/^\d+$/)

      states = !!(if contact = current_user.contacts.where('_id.n' => number.to_i).first
        contact.name = name
        contact.save
      else
        current_user.contacts.create(number: number.to_i, name: name) 
      end)
    end

    render :json => states
  end

  def destroy
    render :json => current_user.contacts.where('_id.n' => params[:id].to_i).destroy
  end
end
