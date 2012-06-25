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
    return render :json => 404 unless list

    forbid = !list.message.draft? rescue false
    return render :json => 403 if forbid

    list.destroy
    render :json => true
  end

  def show
    response['Content-Type'] = 'text/plain'
    response['Content-Disposition'] = 'inline; filename="recipients_list.txt"'
    list = Recipient.where(recipients_list_id: params[:id])
    if params[:filter].present?
      list = list.where(s: params[:filter])
    end

    lim = 10000

    self.response_body = Enumerator.new do |y|
      (list.count / lim.to_f).ceil.times do |i|
        y << (list.skip(i * lim).limit(lim).map{ |r| "+#{r['n']}" }.join("\n") + "\n")
      end
    end
  end
end
