module TargetBase
  def self.included base
    base.class_eval do
      field :recipient_number, type: String

      field :api_id, type: String
      field :api_state_id, type: Integer
      field :api_state, type: String

      index :api_id
      index :api_state_id

      belongs_to :targetable, :polymorphic => true

      def to_xml_node output, explain = true
        reload

        message = Nokogiri::XML::Node.new('message', output.document)

        message['id'] = id.to_s
        message['status'] = api_state_id.to_s

        if explain
          message['recipient'] = recipient_number.to_s
        end

        message.content = api_state.to_s unless api_state_id == 0

        output << message
      end

      def amount increment = 0
        user = self.respond_to?(:user) ? self.user : targetable.user
        user.amount_for recipient_number, increment
      end
    end
  end
end

class Target
  include Mongoid::Document
  include TargetBase
end
