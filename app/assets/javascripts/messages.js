// tools for messages editor
(function()
{
  var tools  =
  {
    phoneRegex: /(?:tel:)?\+(7|38)\s*[\(\)]?\d{3,}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g
    , sanitizeNumber: function(text)
      {
        return '+' + text.replace(/[^\d]/g, '')
      }
    , decorateNumber: function(number)
      {
        var parts = number.match(/\+(\d+)(\d{3})(\d{3})(\d{2})(\d{2})$/)
        return parts ? ('+' + 
                  parts[1] + ' (' +
                    parts[2] + ') ' + 
                      parts[3] + '-' + 
                        parts[4] + '-' +
                          parts[5]) : number
      }
  }

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target || event.target.tagName.toLowerCase() != 'input') $(this).find('input:last').focus();
  })
  $('article.message > div.recipients > input').live('keyup blur', function(event)
  {
    var input = $(this);
    var value = input.val();
    var matches = value.match(tools.phoneRegex);
    if (matches)
    {
      for (var i = 0; i < matches.length; i++)
      {
        var number = tools.sanitizeNumber(matches[i]);

        var link = $('<a></a>');
        link.attr('href', 'tel:' + number);
        link.text(tools.decorateNumber(number));

        link.addClass('bubble').addClass('pseudolink').addClass('black');
        
        link.insertBefore(input);
      }

      var lastMatch = matches[matches.length - 1];

      value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
    }

    input.val(value);
    if (!value.trim().length && input.hasClass('bubble'))
    {
      input.parent('div').trigger('click');
      input.remove();
    }
  })
})()
