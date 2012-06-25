class RecipientsList
  include Mongoid::Document

  belongs_to :message

  belongs_to :user
  validates_presence_of :user # to allow recipients upload into new mailing

  # [ { 'n' => number, 's' => state, 'i' => api_id } ]
  has_many :recipients, dependent: :delete #, autosave: true

  field :summary, type: Summary
  attr_protected :summary
  after_initialize :calc_summary
  before_save :calc_summary

  def list
    recipients
  end

  def method_missing meth, *args, &blk
    list.send meth, *args, &blk
  end

  def need_file?
    list.count > 30
  end

  def parse message, user, recipients
    self.class.parse message, user, recipients, self
  end

  def self.parse message, user, recipients, to = nil, fake_message_id = nil
    to ||= new
    to.message = message
    to.user = user

    Recipient.collection.insert(if recipients.kind_of? Array
      recipients.map{ |n| { 'n' => n.to_i, 's' => nil, 'i' => nil, 'recipients_list_id' => to._id } }
    else
      recipients = recipients.respond_to?(:read) ? recipients.read(nil) : recipients

      regex = /(?:tel:)?\+?(?:#{Summary::PREFIXES.join('|')})\s*[\(\)]?\d{3}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/

      recipients.scan(regex).map do |m|
        phone = m.gsub(/^\d/, '')
        { 'n' => phone.to_i, 's' => nil, 'i' => nil, 'recipients_list_id' => to._id }
      end
    end)

    to.save # to update summary

    to.message_id ||= fake_message_id

    to
  end

  def self.state_callback recipient_id, state, reference = nil
    recipient = recipient_id.present? ? Recipient.find(recipient_id) : Recipient.where(i: reference.to_i).first

    return unless recipient

    recipient.set :s, state
    recipient.set :i, reference.to_i

    # don't need to update summary
  end

protected
  def calc_summary
    summary = Summary.new

    Summary::STATES.each do |state|
      summary[state] = Recipient.where(recipients_list_id: _id, s: state).count
      warn [state, summary[state]]
    end

    Summary::PREFIXES.each do |prefix|
      prefix_int = prefix.to_s.to_i

      summary.total_by_prefixes[prefix] = Recipient.all_of(:recipients_list_id => _id, :n.gte => prefix_int * (10 ** 10), :n.lt => prefix_int.next * (10 ** 10)).count
      warn [prefix, summary.total_by_prefixes[prefix]]
    end

    warn summary

    write_attribute :summary, summary.serialize(summary)
  end
end
