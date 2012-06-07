  var $doc = $(document)
  var $win = $(window)

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
    if (!articles.length) return;

    var scrollTop = $doc.scrollTop() - $('div.pinner').outerHeight();

    count = parseInt(count) || articles.length;
    decades = decades == undefined ? Math.floor(Math.log(count) / Math.log(10)) : decades;
    shift = shift || 0;
    if (shift % 10) shift = Math.floor(shift / 10) * 10;

    var divider = Math.pow(10, decades);
    var blocks = Math.min(Math.ceil(count / divider), 10, articles.length - shift);

    var ul = $('div.pinner div.wrapper ul.float-left').empty();
      
    for (var k = 0, wasActive; k < blocks; k++)
    {
      var
        start = shift + k*divider + 1,
        end = Math.min(shift + (k+1)*divider, articles.length);

      var firstArticle = articles.eq(start - 1);
      var firstArticleHeading = firstArticle.find('h1:first');

      var text = firstArticleHeading.attr('title') || (start == 1 && divider != 1 ? ('<' + divider) : start);
      
      var link = $('<a/>').append($('<u/>').text(text)).
        attr('href', '#' + (firstArticle.attr('id') || start)).
        addClass('pseudolink').
        click(function(event)
            {
              event.preventDefault();

              var id = this.getAttribute('href').substr(1);
              var el, shift = 0;
              if (/^\d+$/.test(id) && (shift = parseInt(id))) { shift--; el = articles.eq(shift) }
              else { el = $('#' + id) }

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

  updateTopNavigation()
});
