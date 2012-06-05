require 'test_helper'

class ContactTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end

  test "check contact for integrity" do
    u = User.create(email: Faker::Internet.email, password: Faker::Internet.user_name)

    phone = ['7', '38'][rand.round] + ("%010d" % (rand(10 ** 10)-1)) # Faker is useless here %(
    name = Faker::Name.name

    c = Contact.create(user: u, number: phone, name: name)

    assert_equal u._id, c.user._id
    assert_equal phone, c.number
    assert_equal name, c.name

    prev_id = c._id.dup

    #puts prev_id

    c = Contact.find(c._id)
    u.reload

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
