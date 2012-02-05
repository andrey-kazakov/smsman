require 'test_helper'

class OrderTest < ActiveSupport::TestCase
  def setup
    password = (rand(9999999999999) + 100000000000).to_s
    @user = User.create(:email => Faker::Internet.email, :first_name => Faker::Name.first_name, :last_name => Faker::Name.last_name, :password => password, :password_confirmation => password)

    class << Faker::PhoneNumber
      def phone_number
        '+' + (10000000000 + rand(99999999999)).to_s
      end
    end
  end

  def teardown
    User.delete_all
    Order.delete_all
    Target.delete_all
  end

  test 'bulk order should create targets and gen valid xml' do
    recipient_numbers = (1..40).to_a.map{ Faker::PhoneNumber.phone_number  }.join(' ')
    @order = BulkOrder.new(:name => Faker::Company.catch_phrase, :sender_number => Faker::PhoneNumber.phone_number, :text => Faker::Lorem.paragraph, :recipient_numbers => recipient_numbers)
    @user.orders << @order

    @order.save!
    @order.reload
    assert_equal 40, @order.targets.count

    Ip2Sms.xml_for(@order) do |tree|
      assert_equal 40, tree.search('sms').count
    end
  end

  test 'individual order should create targets and gen valid xml' do
    recipient_numbers_with_texts = ''
    40.times do
      recipient_numbers_with_texts += "#{Faker::PhoneNumber.phone_number} #{Faker::Lorem.paragraph}\n"
    end
    @order = IndividualOrder.new(:name => Faker::Company.catch_phrase, :sender_number => Faker::PhoneNumber.phone_number, :recipient_numbers_with_texts => recipient_numbers_with_texts)
    @user.orders << @order

    @order.save!
    @order.reload
    assert_equal 40, @order.targets.count

    Ip2Sms.xml_for(@order) do |tree|
      assert_equal 40, tree.search('sms').count
    end
  end

  test 'targets must not touch orders table' do
    recipient_numbers = (1..40).to_a.map{ Faker::PhoneNumber.phone_number  }.join(' ')
    @user.orders.create(:name => Faker::Company.catch_phrase, :sender_number => Faker::PhoneNumber.phone_number, :text => Faker::Lorem.paragraph, :recipient_numbers => recipient_numbers)
    recipient_numbers_with_texts = ''
    40.times do
      recipient_numbers_with_texts += "#{Faker::PhoneNumber.phone_number} #{Faker::Lorem.paragraph}\n"
    end
    @user.orders.create(:name => Faker::Company.catch_phrase, :sender_number => Faker::PhoneNumber.phone_number, :recipient_numbers_with_texts => recipient_numbers_with_texts)

    assert_equal @user.orders.count, Order.all.count
    assert_equal @user.orders.all.to_a, Order.all.to_a
  end

end
