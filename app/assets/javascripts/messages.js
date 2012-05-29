// tools for messages editor
(function()
{
  var $doc = $(document);
  var $win = $(window);

  var scrollTo = function(el)
  {
    el = $(el);

    var pinnerHeight = $('div.pinner').outerHeight();
    var halfHeight = ($win.outerHeight() / 2) - (el.outerHeight() / 2);

    $doc.scrollTop($(el).position().top + pinnerHeight - halfHeight);
  }

  var typoNumber = function(number, to)
  {
    to = $(to).empty();
    number = number.toString();

    while (number)
    {
      var part = number.substr(-3);
      number = number.substr(0, number.length - 3);

      to.prepend(part);
      if (number) to.prepend($('<span/>').addClass('thinsp').text(' '))
    }
  }

  // working w/ whole messages

  var messagesSelector = 'section.wrapper > article.message:not(.new)'

  var countMessages = function()
  {
    return $(messagesSelector).length
  }

  var countPrefixNumbers = function(prefix)
  {
    return $(messagesSelector).find('div.recipients').find('input.bubble.contact, input.bubble.phone').filter(function() { return this.getAttribute('name').indexOf('mailing[][recipients][' + prefix) == 0 }).length
  }

  var setSendingCounts = function()
  {
    var prefixes = ['7', '38'];
    for (var i = 0; i < prefixes.length; i++)
    {
      var prefix = prefixes[i];

      typoNumber(countPrefixNumbers(prefix), '#sending_' + prefix)
    }
  }

  var updateMessagesNavigation = function(count, decades, shift, undefined)
  {
    var messages = $(messagesSelector);
    var scrollTop = $doc.scrollTop() - $('div.pinner').outerHeight();

    count = parseInt(count) || messages.length;
    decades = decades == undefined ? Math.floor(Math.log(count) / Math.log(10)) : decades;
    shift = shift || 0;

    var divider = Math.pow(10, decades);
    var blocks = Math.min(Math.ceil(count / divider), 10, messages.length - shift);

    var ul = $('div.pinner div.wrapper ul.float-left').empty();
      
    for (var k = 0, wasActive; k < blocks; k++)
    {
      var
        start = shift + k*divider + 1,
        end = Math.min(shift + (k+1)*divider, messages.length);

      var text = start == 1 && divider != 1 ? ('<' + divider) : start;
      
      var link = $('<a/>').text(text).
        attr('href', '#' + start).
        click(function()
            {
              event.preventDefault();

              var shift = parseInt(this.getAttribute('href').substr(1)) - 1;
              scrollTo(messages.eq(shift));

              if (decades > 0) setTimeout(function() { updateMessagesNavigation(count, decades - 1, shift); }, 100);

              return false
            });

      var firstMessage = messages.eq(start - 1);
      var firstMessagePosition = firstMessage && firstMessage.position();

      var afterLastMessage = messages.eq(end);
      var afterLastMessagePositionTop = afterLastMessage.position() ? afterLastMessage.position().top : $doc.outerHeight();
      
      var halfHeight = scrollTop + ($win.outerHeight() / 2);

      if (!wasActive &&
          firstMessagePosition && 
          halfHeight <= afterLastMessagePositionTop &&
          halfHeight > firstMessagePosition.top
         )
      {
        link.addClass('active');
        wasActive = true
      }

      ul.append($('<li/>').append(link));
    }


  }

  $doc.bind('change click', function(event)
  {
    var i = 0, wasRemoval;

    $(messagesSelector).each(function()
    {
      i++;
      var article = $(this) //.parents('article');
      if (wasRemoval) article.find('h1.number').text(i);

      if (article.find('textarea').val().trim()) return;

      if (article.find(':focus').length) return;

      if (article.find('div.recipients').find('input:not([placeholder])').length) return;

      article.slideUp('fast', function() { article.remove() });
      i--;
      wasRemoval = true;
    });

    // `i' is last message number now, so it's equal to their count

    if (wasRemoval) updateMessagesNavigation(i);

  }).bind('ready scroll', updateMessagesNavigation);

  $('section.wrapper > article.message.new > textarea').live('focus', function(event)
  {
    // try to find some empty message first
    var other = $(messagesSelector).filter(function() { var a = $(this); return a.find('div.recipients > input.new[placeholder]').length && /^\s*$/.test(a.find('textarea').val()) })
    if (other.length)
    {
      other.find('textarea').focus();
      return
    }

    var area = $(this);
    var article = area.parent('article');

    article.clone().hide().insertAfter(article).slideDown('fast');

    article.removeClass('new')

    area.attr('placeholder', 'Текст сообщения…');

    $('<div class="recipients"><input class="new" type="text" placeholder="Получатели…" /></div>').appendTo(article);
    $('<h1 class="bold amount">0</h1>').appendTo(article);

    $('<h1 class="bold number"></h1>').text(countMessages()).insertBefore(area);

    updateMessagesNavigation();
  });



  // working w/ recipients

  var fixWidth = function(input)
  {
    input = $(input);
    if (!input.attr('placeholder'))
    {
      var test = $('<div></div>');
      test.addClass('bubble');

      test.text(input.val().toString() + (input.is(':focus') ? "—" : ''));
      test.css({ position: 'absolute', left: -9999, top: -9999 });

      $('body').append(test);

      var targetWidth = test.outerWidth() + 2;

      input.css({ width: targetWidth });

      test.remove();
    }
    else
    {
      input.css({ width: '' })
    }
  }

  $doc.ready(function(){ setTimeout(function(){ $('.recipients input').each(function() { fixWidth(this) } ) }, 150) });


  var tools  =
  {
      phoneRegex: /(?:tel:)?\+(7|38)\s*[\(\)]?\d{3}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g
    , wannaBeAPhoneRegex: /^\+?(7|38)/

    , ltrim: function(text)
      {
        return(text = text.replace(/^\s+/, ''))
      }
    , wannaBeAPhone: function(text)
      {
        return tools.wannaBeAPhoneRegex.test(text)
      }
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
        value = tools.ltrim(value);
        if (tools.wannaBeAPhone(value))
          value = tools.decorateNumber(tools.sanitizeNumber(value));
        return value;
      }
  }

  var lookupContact = function(text, shift)
  {
    text = text.replace(/^\s+/, '');
    if (!text) return;

    shift = shift || 0; 

    if (tools.wannaBeAPhoneRegex.test(text))
    {
      text = tools.sanitizeNumber(text);

      return { name: CONTACTS[text], number: text }
    }
    else
    {
      var matches = [];

      for (var number in CONTACTS)
      {
        var name = CONTACTS[number];

        if (name && name.toLowerCase().indexOf(text.toLowerCase()) == 0)
        {
          matches.push({ name: name, number: number })
        }
      }

      shift %= matches.length;
      if (shift < 0) shift = matches.length + shift;

      var ret = matches[shift];
      if (ret)
      {
        ret.suggestion_start = text.length;
        ret.suggestion_index = shift;
        ret.suggestions_count = matches.length;

        return ret
      }
      else
      {
        return null
      }
    }
  };


  var createInput = function(number, bubble)
  {
     var input = $('<input/>');
     if (bubble) input.addClass('bubble'); else input.addClass('new');

     input.attr('name', 'mailing[][recipients][' + number + ']');
     input.attr('type', 'text');

     input.val(tools.decorateNumber(number));

     fixWidth(input);

     return input
  }
  var modifyAmount = function(where)
  {
    var amount = where.parents('article.message').find('h1.amount');
    amount.text(where.parent('div.recipients').find('input.phone, input.contact').size());

    setSendingCounts();
  }

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input') return;
    
    event.preventDefault();

    var div = $(this);
    var input = div.find('input.new');

    /*if (!input.length)
    {
      input = createInput('', false).appendTo(div.empty());
    }*/

    input.focus();
  })

  $('article.message > div.recipients > input').live('keydown keyup', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();

    var notEmpty = value.length > 0

    var caretAtStart = caret.start == 0, 
        caretAtEnd   = caret.end == value.length;

    var allSelected  =  notEmpty && caretAtStart && caretAtEnd;

    var dontmatch;
    var down = event.type == 'keydown';

    var autocomplete = input.attr('data-autocomplete');
    var currentSuggestionStart = parseInt(input.attr('data-suggestion-start')) || 0;
    var currentSuggestionIndex = parseInt(input.attr('data-suggestion-index')) || 0;

    var doSuggestionLookup = function(input, value)
    {
      var shift = input.attr('data-suggestion-index') || 0;

      var data = lookupContact(value, shift);
      if (!data) return;

      input.attr('name', 'mailing[][recipients][' + data.number + ']').

        val(data.name).

        attr('data-autocomplete', data.name).
        attr('data-suggestion-index', data.suggestion_index).
        attr('data-suggestion-start', data.suggestion_start).

        caret({ start: data.suggestion_start, end: data.name.length });

      if (input.hasClass('new'))
      {
        input.removeClass('new').addClass('bubble');
      }
    }
    var removeAutocomplete = function(input, dropSuggestion)
    {
      input.removeAttr('data-autocomplete').
        removeAttr('data-suggestion-index').
        removeAttr('data-suggestion-start');

      if (dropSuggestion) input.val(input.val().substr(0, input.caret().start));
    }

    switch (event.keyCode)
    {
      case 8:  // Backspace
      case 37: // <-
        if (down && autocomplete)
        {
          event.preventDefault();
          removeAutocomplete(input, true)
        }
        else if (caretAtStart && !allSelected && down)
        {
          event.preventDefault();
          (input.prev().length ? input.prev() : input.parent('div').find('input.new')).focus().caret(/$/);
          input.blur()
        }
        break;
      case 46: // Delete
      case 39: // ->
        if (down && autocomplete)
        {
          event.preventDefault();
        }
        if (caretAtEnd && !allSelected && down)
        {
          event.preventDefault();
          (input.next().length ? input.next() : input.parent('div').find('input:first')).focus().caret({ start: 0, end: 0 });
          input.blur()
        }
        break;
      case 36: // Home
        input.caret({ start: 0, end: 0});
        break;
      case 35: // End
        input.caret({ start: value.length, end: value.length });
        break;
      case event.charCode < 32: // do all service keys like default
        event.preventDefault();
      case  9: // Tab
        if (down && autocomplete)
        {
          event.preventDefault();

          if (event.shiftKey)
            currentSuggestionIndex--;
          else
            currentSuggestionIndex++;

          input.attr('data-suggestion-index', currentSuggestionIndex);

          break;
        }
      case event.keyCode <= 32:
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

              input.parent('div.recipients').find('input[name="mailing[][recipients][' + number + ']"]').not(input).remove();

              var bubble = createInput(number, true).addClass('phone').insertBefore(input);

              var data = lookupContact(number);
              if (data.name)
              {
                bubble.removeClass('phone').addClass('contact').val(data.name)
                fixWidth(bubble)
              }

            }

            var lastMatch = matches[matches.length - 1];

            value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
          }
        }
        
        if (caretAtEnd)
        {
          value = tools.decorateValue(value);
          if (input.val() != value) input.val(tools.ltrim(value));

          // autocomplete shit
          if (!down && notEmpty && !tools.wannaBeAPhone(value))
          {
            value = value.substr(0, caret.start);

            if (autocomplete && currentSuggestionStart != caret.start)
            {
              input.caret({ start: currentSuggestionStart, end: autocomplete.length });
            }

            if (autocomplete)
            {
              if (autocomplete.substr(0, caret.start) != input.val().substr(0, caret.start)) removeAutocomplete(input)
            }

            doSuggestionLookup(input, value)

          }
        }
    }

    if (input.hasClass('new'))
    {
      if (!input.val().trim() && !input.prev().length && !input.next().length)
        input.attr('placeholder', 'Получатели…');
      else
        input.removeAttr('placeholder');
    }

    fixWidth(input);
    modifyAmount(input);
  }).live('keyrepeat focus blur change', function(event)
  {
    fixWidth(this);
  }).live('focus', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble'))
    {
      if (!input.val().trim() && !input.prev().length && !input.next().length)
        input.attr('placeholder', 'Получатели…');
      else
        input.removeAttr('placeholder');
      return;
    }

    input.removeClass().addClass('bubble');
    input.val(tools.decorateValue(input.attr('name') ? input.attr('name').replace(/^mailing\[\]\[recipients\]\[/, '+') : input.val()));

    fixWidth(input);
    modifyAmount(input);
  }).live('blur', function(event)
  {
    var input = $(this);
    if (!input.hasClass('bubble'))
    {
      if (!input.val().trim() && !input.prev().length && !input.next().length)
      {
        input.attr('placeholder', 'Получатели…');
      }
      return;
    }

    if (!input.val().trim())
    {
      input.parent().length && input.remove()
    }
    else
    {
      var contact;
      if (contact = lookupContact(input.val()))
      {
        var number = contact.number;

        input.parent('div.recipients').find('input[name="mailing[][recipients][' + number + ']"]').not(input).remove();

        input.attr('name', 'mailing[][recipients][' + number + ']');
        input.addClass('phone');
        modifyAmount(input);

        if (contact.name)
        {
          input.removeClass('phone').addClass('contact').val(contact.name)
        }
        fixWidth(input)
      }
      else if (!input.hasClass('contact'))
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
