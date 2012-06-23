class RecipientsListController < ApplicationController
  before_filter :authenticate_user!

  layout false
  
  def create
    render :text => params.inspect
  end

  def update
    render :text => params.inspect
  end

  def destroy
    #
  end
end
