(function()
{
  var
    hide = function(event)
    {
      event.preventDefault();

      var th = $(this);
      th.slideUp('fast', function(){ th.remove() })
    }
  , isString = function(s) { return s.length && s.substr }
  , append = function(to, kind, text)
  {
    $(to).append($('<a/>').attr('href', '#').addClass(kind).text(text)) 
  };

  $('.report > a').live('click', hide);

  flash = function(kind, what)
  {
    $doc.ready(function()
    {
      if (isString(what))
      {
        append('#flash', kind, what)
      }
      else
      {
        var form = $('a.drop#' + kind).addClass('active').nextAll('form:first');

        for (var selector in what)
        {
          var input = form.find('input#' + selector);
          var paragraph = input.parents('p');

          var report = $('<div/>').addClass('report').insertAfter(paragraph);

          for (var type in what[selector])
          {
            var text = what[selector][type];

            type == 'value' ? input.val(text) : append(report, type, text);
          }
        }
      }
    })
  }
})()
