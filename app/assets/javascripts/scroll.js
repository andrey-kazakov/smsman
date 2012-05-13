var offset = $('nav#top').height() - $('.pinner').height();

var pinThePinner = function() {
  var scrollTop = $(window).scrollTop();
  if ( scrollTop >= offset ) {
    $('.pinner').addClass('fixed');
    $('.nav#top').addClass('pinnerfix');
  } if ( scrollTop <= offset ) {
    $('.pinner').removeClass('fixed');
    $('.nav#top').removeClass('pinnerfix');
  }
}

$(document).bind('scroll', function(e) {
  pinThePinner();
});