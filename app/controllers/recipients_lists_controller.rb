class RecipientsListsController < ApplicationController
  before_filter :authenticate_user!

  layout false
  
  def create
    current_list = params[:recipients_lists].kind_of?(Hash) ? RecipientsList.where(_id: params[:recipients_lists].keys.first).first : nil
    recipients = params[:recipients_lists].kind_of?(Hash) ? params[:recipients_lists].values.first : params[:recipients_lists].first

    render :partial => 'processed', object: RecipientsList.parse(nil, current_user, recipients, current_list, params[:fake_message_id])
  end

  def destroy
    list = current_user.recipients_lists.where(_id: params[:id]).first
    return render :head => :not_found unless list

    forbid = list.message and !list.message.draft?
    return render :head => :forbidden if forbid

    list.destroy
    render :json => true
  end
end
