require 'test_helper'

class SummaryTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end

  test "summary must calculate summary but anything else :)" do
    states = [nil, :pending, :delivered, :failed]

    s1 = Summary.new

    times1 = Hash[Summary::PREFIXES.map{ |prefix| [prefix, rand(1000) * 4] }]
    total1 = times1.map{ |k,v| v }.inject(:+)

    times1.each_pair{ |prefix, times| times.times{ |i| s1.add(prefix.to_s + (rand(10 ** 10) - 1).to_s, states[i % 4]) } }

    assert_equal s1, Summary.new(s1)

    # total ok
    assert_equal total1, s1.total

    # total_by_prefixes ok
    times1.each_pair{ |prefix, times| assert_equal times, s1.total_by_prefixes[prefix] }

    # states ok
    states[1..-1].each{ |state| assert_equal total1 / 4, s1[state] }

    ###########

    s2 = Summary.new

    times2 = Hash[Summary::PREFIXES.map{ |prefix| [prefix, rand(1000) * 4] }]
    total2 = times2.map{ |k,v| v }.inject(:+)

    times2.each_pair{ |prefix, times| times.times{ |i| s2.add(prefix.to_s + (rand(10 ** 10) - 1).to_s, states[i % 4]) } }

    s1.add(s2)

    # total ok
    assert_equal(total1+total2, s1.total)

    # total_by_prefixes ok
    times1.each_pair{ |prefix, times| assert_equal(times+times2[prefix], s1.total_by_prefixes[prefix]) }

    # states ok
    states[1..-1].each{ |state| assert_equal(total1/4, s1[state] - s2[state]) }

  end

  test "summary must serialize and deserialize properly" do
    states = [nil, :pending, :delivered, :failed]

    s1 = Summary.new
    
    times1 = Hash[Summary::PREFIXES.map{ |prefix| [prefix, rand(1000) * 4] }]

    times1.each_pair{ |prefix, times| times.times{ |i| s1.add(prefix.to_s + (rand(10 ** 10) - 1).to_s, states[i % 4]) } }

    assert_equal times1, s1.serialize(s1)[:total_by_prefixes]

    assert_equal s1, s1.deserialize(s1.serialize(s1))
  end
end
