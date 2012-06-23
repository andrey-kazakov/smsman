class RecipientsListsController < ApplicationController
  before_filter :authenticate_user!

  layout false
  
  def create
    render :partial => 'processed', object: RecipientsList.last
  end

  def destroy
    #
  end
end
