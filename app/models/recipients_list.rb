class RecipientsList
  include Mongoid::Document

  belongs_to :message

  belongs_to :user
  validates_presence_of :user # to allow recipients upload into new mailing

  # [ { 'n' => number, 's' => state, 'i' => api_id } ]
  field :list, type: Array, default: []

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  after_validation :calc_summary

  def method_missing meth, *args, &blk
    list.send meth, *args, &blk
  end

  def self.parse recipients, options = {}
    if recipients.kind_of? Array
      list = recipients.map{ |n| { 'n' => n.to_i, 's' => nil, 'i' => nil } }
      new(options.merge list: list)
    end
  end

  # { :recipients_list_id => recipients_list._id, :recipient_index => index }
  def self.state_callback message_id, state, reference = nil
    object = find(message_id[:recipients_list_id])
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
  end
end
