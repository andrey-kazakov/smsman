// tools for messages editor
(function()
{
  var autocompleteSettings = 
       {
         source: CONTACTS,
         position: { 
           my : "left top",
           offset: "-6 -3",
           at: "left bottom",
           collision: "none" 
         }
       };

  $(document).ready(function(){ $('.recipients input.new').autocomplete(autocompleteSettings); });


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

     input.attr('size', Math.max(input.val().length, 1));

     input.autocomplete(autocompleteSettings);

     return input
  }

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input') return;
    
    event.preventDefault();
    $(this).find('input.new').focus();
  })

  $('article.message > div.recipients > input').live('keyup keyrepeat', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();
    var allselected = (caret.start == 0 && caret.end == value.length);
    var dontmatch;

    switch (event.keyCode)
    {
      case 8:  // Backspace
      case 37: // <-
        if (caret.start == 0 || allselected)
        {
          //event.preventDefault();
          input.prev().length && input.prev().focus();
          input.blur()
        }
        break;
      case 46: // Delete
      case 39: // ->
        if (caret.end == value.length || allselected)
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

            createInput(number, true).insertBefore(input);
          }

          var lastMatch = matches[matches.length - 1];

          value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
        }

        input.val(value);
        input.attr('size', Math.max(input.val().length, 1));

    }
  }).live('keydown keyup keypress keyrepeat focus blur change mousedown mouseup click mouseover mouseout', function(event)
  {
    var input = $(this);
    var test = $('<div class="bubble"></div>');

    test.text(input.val().toString() + "|");
    test.css({ position: 'absolute', left: -9999, top: -9999 });

    $('article.message > div.recipients').append(test);

    input.css({ width: test.outerWidth() });

    test.remove()
  }).live('focus', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;

    input.removeClass('contact');
    input.val(tools.decorateNumber(tools.sanitizeNumber(input.attr('id'))));

  }).live('blur', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;

    if (!input.val().trim())
    {
      input.remove()
    }
    else
    {
      var match;
      if (match = input.val().match(tools.phoneRegex))
      {
        input.attr('id', 'tel' + tools.sanitizeNumber(match[0]));
      }
      else
      {
        event.preventDefault();
        input.focus();
        input.caret({ start: 0, end: input.val().length });
      }
    }
  });
})()
