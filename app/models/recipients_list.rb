class RecipientsList
  include Mongoid::Document

  belongs_to :message

  belongs_to :user
  #validates_presence_of :user # to allow recipients upload into new mailing

  # [ { 'n' => number, 's' => state, 'i' => api_id } ]
  field :list, type: Array, default: []
  validates_presence_of :list

  index 'list.n'
  index 'list.i'

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  def method_missing meth, *args, &blk
    list.send meth, *args, &blk
  end

  def self.parse message, user, recipients
    if recipients.kind_of? Array
      list = recipients.map{ |n| { 'n' => n.to_i, 's' => nil, 'i' => nil } }

      recipients_list = new
      recipients_list.message = message
      recipients_list.list = list
      recipients_list.user = user

      recipients_list.save

      recipients_list
    end
  end

  # { :recipients_list_id => recipients_list._id, :recipient_index => index }
  def self.state_callback message_id, state, reference = nil
    object = if message_id
               find(message_id[:recipients_list_id])
             else
               # find message by reference
               object = where('list.i' => reference.to_i).first

               recipient_index = -1
               object.list.each_with_index do |recipient, index|
                 if recipient['i'] == reference.to_i
                   recipient_index = index
                   break
                 end
               end

               message_id = {
                 recipients_list_id: object._id,
                 recipient_index: recipient_index
               }

               object
             end

    list = object.list

    list[message_id[:recipient_index]]['s'] = state
    list[message_id[:recipient_index]]['i'] = reference.to_i

    object.save
  end

protected
  def calc_summary
    summary = Summary.new

    list.each do |recipient|
      summary.add(recipient['n'], recipient['s'])
    end

    write_attribute :summary, summary.serialize(summary)

    warn [list, user]
    warn errors.full_messages
  end
end