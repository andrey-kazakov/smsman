  var $doc = $(document)
  var $win = $(window)

  var typoNumber = function(number, to)
  {
    to = $(to).empty();
    number = number.toString();

    while (number)
    {
      var part = number.substr(-3);
      number = number.substr(0, number.length - 3);

      to.prepend(part);
      if (number) to.prepend($('<span/>').addClass('thinsp'))
    }

    return to
  }

  var scrollTo = function(el, callback, what)
  {
    el = $(el);

    var pinnerHeight = what ? 0 : $('div.pinner').outerHeight();
    var halfHeight = ((what ? $(what) : $win).height() / 2) - (el.outerHeight() / 2);

    $(what || 'html,body').animate({ scrollTop: (el.position().top + pinnerHeight - halfHeight) }, 200, callback);
  }

  var updateTopNavigation = function(count, decades, shift, undefined)
  {
    var articles = $('section.wrapper > article:not(.new)');

    var scrollTop = $doc.scrollTop() - $('div.pinner').outerHeight();

    count = parseInt(count) || articles.length;
    decades = decades == undefined ? Math.floor(Math.log(count) / Math.log(10)) : decades;
    shift = shift || 0;
    if (shift % 10) shift = Math.floor(shift / 10) * 10;

    var divider = Math.pow(10, decades);
    var blocks = Math.min(Math.ceil(count / divider), 10, articles.length - shift);

    var ul = $('div.pinner div.wrapper ul.float-left').empty();
    ul.prev()[articles.length ? 'removeClass' : 'addClass']('none');
      
    for (var k = 0, wasActive; k < blocks; k++)
    {
      var
        start = shift + k*divider + 1,
        end = Math.min(shift + (k+1)*divider, articles.length);

      var firstArticle = articles.eq(start - 1);
      var firstArticleHeading = firstArticle.find('h1:first');

      var text = firstArticleHeading.attr('title') || (start == 1 && divider != 1 ? ('<' + divider) : start);
      
      var link = $('<a/>').append($('<u/>').text(text)).
        attr('href', '#' + firstArticle.attr('id')).
        attr('data-start', start).
        addClass('pseudolink').
        click(function(event)
            {
              event.preventDefault();

              var el = $(this.getAttribute('href')), shift = parseInt(this.getAttribute('data-start'))

              scrollTo(el, function(){ (articles.length - shift > 0) && tools.delay(updateTopNavigation)(count, Math.max(decades - 1, 0), shift) });

              return false
            });

      if (!wasActive)
      {
        if (shift == start)
        {
          link.addClass('active');
          wasActive = true
        }
        else
        {
          var firstArticlePosition = firstArticle && firstArticle.position();

          var afterLastArticle = articles.eq(end);
          var afterLastArticlePositionTop = afterLastArticle.position() ? afterLastArticle.position().top : $doc.outerHeight();
          
          var halfHeight = scrollTop + ($win.outerHeight() / 2);

          if (firstArticlePosition && 
              halfHeight <= afterLastArticlePositionTop &&
              halfHeight > firstArticlePosition.top
             )
          {
            link.addClass('active');
            wasActive = true
          }
        }
      }

      ul.append($('<li/>').append(link));
    }


  }


$(document).bind('ready scroll load', function()
{
  var pinner = $('div.pinner'),
      navtop = $('nav#top'),
      flash  = $('nav#top > .flash');

  var scrollTop = $(document).scrollTop();
  if ( flash.size >= 1 ) {
    navtop.addClass('fixed').css('padding-bottom', pinner.outerHeight()).css('padding-top', flash.outerHeight());
    pinner.css('top', flash.outerHeight()).css('padding-top', navtop.height());
  }
  else
  {
    var offset = navtop.position().top + navtop.outerHeight() - pinner.outerHeight();
    if (scrollTop > offset)
    {
      navtop.addClass('fixed').css('padding-bottom', pinner.outerHeight());
    }
    else
    {
      navtop.removeClass('fixed').css('padding-bottom', '');
    }
  }

  updateTopNavigation()
});
