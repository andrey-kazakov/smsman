// tools for messages editor
(function()
{
  var autocomplete = function(jq)
  {
    return $(jq).autocomplete(
       {
         source: CONTACTS,
         position: { 
           my : "left top",
           offset: "-6 -3",
           at: "left bottom",
           collision: "none" 
         }
       })
  }
  var fixWidth = function(input)
  {
    input = $(input);
    var test = $('<div></div>');
    test.addClass('bubble');

    test.text(input.val().toString() + (input.is(':focus') ? "—" : ''));
    test.css({ position: 'absolute', left: -9999, top: -9999 });

    $('body').append(test);

    var targetWidth = test.outerWidth();

    input.css({ width: targetWidth });

    test.remove()
  }

  $(document).ready(function(){ autocomplete('.recipients input.new'); $('.recipients input').each(function() { fixWidth(this) }) });


  var tools  =
  {
      phoneRegex: /(?:tel:)?\+(7|38)\s*[\(\)]?\d{3,}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g

    , sanitizeNumber: function(text)
      {
        return text ? (text.replace(/[^\d]/g, '')) : ''
      }
    , decorateNumber: function(number)
      {
        var parts = number.match(/\+?(\d+)(\d{3})(\d{3})(\d{2})(\d{2})$/)
        return parts && parts[1] && parts[5] ? ('+' + 
                  parts[1] + ' (' +
                    parts[2] + ') ' + 
                      parts[3] + '-' + 
                        parts[4] + '-' +
                          parts[5]) : number
      }
  }

  var createInput = function(number, bubble)
  {
     var input = $('<input/>');
     if (bubble) input.addClass('bubble'); else input.addClass('new');

     input.attr('id', 'tel' + number);
     input.attr('type', 'text');

     input.val(tools.decorateNumber(number));

     autocomplete(input);

     return input
  }
  var modifyAmount = function(where)
  {
    var amount = where.parents('article.message').find('h1.amount');
    amount.text(where.parent('div.recipients').find('input.phone, input.contact').size());
  }

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input') return;
    
    event.preventDefault();
    $(this).find('input.new').focus();
  })

  $('article.message > div.recipients > input').live('keydown', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();
    var allselected = value.length > 0 && (caret.start == 0 && caret.end == value.length);
    var dontmatch;

    switch (event.keyCode)
    {
      case 8:  // Backspace
      case 37: // <-
        if (caret.start == 0 && !allselected)
        {
          //event.preventDefault();
          input.prev().length && input.prev().focus().caret(/$/);
          input.blur()
        }
        break;
      case 46: // Delete
      case 39: // ->
        if (caret.end == value.length && !allselected)
        {
          //event.preventDefault();
          input.next().length && input.next().focus().caret({ start: 0, end: 0 });
          input.blur()
        }
        break;
      case 32: // Space
        dontmatch = true;
      default:
        var matches = value.match(tools.phoneRegex);
        if (!dontmatch && matches)
        {
          for (var i = 0; i < matches.length; i++)
          {
            var number = tools.sanitizeNumber(matches[i]);

            createInput(number, true).addClass('phone').insertBefore(input);
            modifyAmount(input);
          }

          var lastMatch = matches[matches.length - 1];

          value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
        }

        input.val(value);
    }
  }).live('keydown keyup keyrepeat focus blur change mouseup mouseover', function(event)
  {
    var input = $(this);
    fixWidth(input);
    modifyAmount(input);
  }).live('focus', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;

    input.removeClass().addClass('bubble');
    input.val(tools.decorateNumber(tools.sanitizeNumber(input.attr('id'))));

    input.trigger('change');

  }).live('blur', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;

    if (!input.val().trim())
    {
      input.parent().length && input.remove()
    }
    else
    {
      var match;
      if (match = input.val().match(tools.phoneRegex))
      {
        modifyAmount(input);
        input.attr('id', 'tel' + tools.sanitizeNumber(match[0]));
        input.addClass('phone');
      }
      else
      {
        modifyAmount(input);
        event.preventDefault();
        setTimeout(function()
        {
          input.focus();
          input.caret({ start: 0, end: input.val().length });
        }, 100);
      }
    }
  });
})()
