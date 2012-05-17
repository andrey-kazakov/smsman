// tools for messages editor
(function()
{
  var fixWidth = function(input)
  {
    input = $(input);
    var test = $('<div></div>');
    test.addClass('bubble');

    test.text(input.val().toString() + (input.is(':focus') ? "—" : ''));
    test.css({ position: 'absolute', left: -9999, top: -9999 });

    $('body').append(test);

    var targetWidth = test.outerWidth() + 1;

    input.css({ width: targetWidth });

    test.remove()
  }

  $(document).ready(function(){ setTimeout(function(){ $('.recipients input').each(function() { fixWidth(this) } ) }, 150) });


  var tools  =
  {
      phoneRegex: /(?:tel:)?\+(7|38)\s*[\(\)]?\d{3}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g

    , sanitizeNumber: function(text)
      {
        return text ? (text.replace(/[^\d]/g, '')) : ''
      }
    , decorateNumber: function(number)
      {
        var parts = number.match(/^\+?(7|38)(\d{1,3})?(\d{1,3})?(\d{1,2})?(\d{1,2})?$/)
        if (!parts || !parts[1]) return number;

        var ret = ('+' + parts[1] + ' (');

        if (parts[2]) ret += parts[2];
        if (parts[2] && parts[2].length == 3) ret += ') ';

        if (parts[3]) ret += parts[3];
        if (parts[3] && parts[3].length == 3) ret += '-';

        if (parts[4]) ret += parts[4];
        if (parts[4] && parts[4].length == 2) ret += '-';

        if (parts[5]) ret += parts[5];

        return ret
      }
    , decorateValue: function(value)
      {
        if (/^\+?(7|38)/.test(value.trim()))
          value = tools.decorateNumber(tools.sanitizeNumber(value.trim()))
        return value;
      }
  }

  var lookupContact = function(text, callback)
  {
    text = text.replace(/^\s+/, '');

    if (/^\+?(7|38)/.test(text))
    {
      text = tools.sanitizeNumber(text);

      CONTACTS[text] && callback({ name: CONTACTS[text], number: text })
    }
    else
    {
      for (var number in CONTACTS)
      {
        var name = CONTACTS[number];

        if (name.toLowerCase().indexOf(test.toLowerCase()) == 0)
        {
          callback({ name: name, number: number })
        }
      }
    }
  };


  var createInput = function(number, bubble)
  {
     var input = $('<input/>');
     if (bubble) input.addClass('bubble'); else input.addClass('new');

     input.attr('id', 'tel' + number);
     input.attr('type', 'text');

     input.val(tools.decorateNumber(number));

     fixWidth(input);

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

  $('article.message > div.recipients > input').live('keydown keyup', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();
    var allselected = value.length > 0 && (caret.start == 0 && caret.end == value.length);
    var dontmatch;
    var down = event.type == 'keydown';

    switch (event.keyCode)
    {
      case 8:  // Backspace
      case 37: // <-
        if (caret.start == 0 && !allselected && down)
        {
          event.preventDefault();
          input.prev().length && input.prev().focus().caret(/$/);
          input.blur()
        }
        break;
      case 46: // Delete
      case 39: // ->
        if (caret.end == value.length && !allselected && down)
        {
          event.preventDefault();
          input.next().length && input.next().focus().caret({ start: 0, end: 0 });
          input.blur()
        }
        break;
      case event.keyCode <= 32: // Space
        dontmatch = true;
      default:
        if (!down)
        {
          var matches = value.match(tools.phoneRegex);
          if (!dontmatch && matches)
          {
            for (var i = 0; i < matches.length; i++)
            {
              var number = tools.sanitizeNumber(matches[i]);

              input.parent('div.recipients').find('input#tel' + number).not(input).remove();

              var bubble = createInput(number, true).addClass('phone').insertBefore(input);

              lookupContact(number, function(data)
              {
                bubble.removeClass('phone').addClass('contact').val(data.name)
                fixWidth(bubble)
              })

            }

            var lastMatch = matches[matches.length - 1];

            value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
            if (input.val() != value) input.val(value.trim());
          }
        }
        
        if (caret.end == input.val().length)
        {
          value = tools.decorateValue(value)
          input.val(value);
        }
    }

    fixWidth(input);
    modifyAmount(input);
  }).live('keyrepeat focus blur change', function(event)
  {
    var input = $(this);

    fixWidth(input);
    modifyAmount(input);
  }).live('focus', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;

    input.removeClass().addClass('bubble');
    input.val(tools.decorateValue(input.attr('id') ? input.attr('id').replace(/^tel/, '+') : input.val()));

    input.trigger('change');

  }).live('blur', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble')) return;
    input.removeClass().addClass('bubble');

    if (!input.val().trim())
    {
      input.parent().length && input.remove()
    }
    else
    {
      var match;
      if (match = input.val().match(tools.phoneRegex))
      {
        var number = tools.sanitizeNumber(match[0]);

        input.parent('div.recipients').find('input#tel' + number).not(input).remove();

        input.attr('id', 'tel' + number);
        input.addClass('phone');
        modifyAmount(input);

        lookupContact(number, function(data)
        {
          input.removeClass('phone').addClass('contact').val(data.name)
          fixWidth(input)
        })
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
