$(document).ready(function() {
  var offset = $('nav#top').height() - $('.pinner').height();
  var pinThePinner = function() {
    var scrollTop = $(window).scrollTop();
    if ( scrollTop >= offset ) {
      $('nav#top').addClass('fixed').css('padding-bottom', $('.pinner').height());
    } if ( scrollTop <= offset ) {
      $('nav#top').removeClass('fixed').removeAttr('style');
    }
  }

  $(document).bind('scroll', function(e) {
    pinThePinner();
  });
});