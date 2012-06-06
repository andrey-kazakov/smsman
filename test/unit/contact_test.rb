require 'test_helper'

class ContactTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end

  test "check contact for integrity" do
    u = User.create(email: Faker::Internet.email, password: Faker::Internet.user_name)

    phone = Summary::PREFIXES[rand.round].to_s + ("%010d" % (rand(10 ** 10)-1)) # Faker is useless here %(
    name = Faker::Name.name

    c = u.contacts.create(number: phone, name: name)

    assert_equal u._id, c.user._id
    assert_equal phone, c.number
    assert_equal name, c.name

    prev_id = c._id.dup

    #puts prev_id

    u.reload

    c = Contact.find(c._id)

    #assert_equal prev_id, c._id

    assert_equal Contact, c.class

    assert_equal u.id, c._id['u']
    assert_equal phone, c._id['n'].to_s

    assert_equal u.class, c.user.class

    assert_equal u._id, c.user._id
    assert_equal phone, c.number
    assert_equal name, c.name

    assert_equal u.contacts.first._id, c._id
    
  end
end
