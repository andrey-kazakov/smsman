$(document).bind('ready scroll load', function()
{
  var pinner = $('div.pinner'), navtop = $('nav#top');

  var offset = navtop.position().top + navtop.outerHeight() - pinner.outerHeight();
  var scrollTop = $(document).scrollTop();

  if (scrollTop > offset)
  {
    navtop.addClass('fixed').css('padding-bottom', pinner.outerHeight());
  }
  else
  {
    navtop.removeClass('fixed').css('padding-bottom', '');
  }
});
