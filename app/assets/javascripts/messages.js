// tools for messages editor
(function()
{
  var $doc = $(document);
  var $win = $(window);

  var each = tools.each;

  var billingPrefixes = ['7', '38'];

  var scrollTo = function(el, callback, what)
  {
    el = $(el);

    var pinnerHeight = what ? 0 : $('div.pinner').outerHeight();
    var halfHeight = ((what ? $(what) : $win).height() / 2) - (el.outerHeight() / 2);

    $(what || 'html,body').animate({ scrollTop: (el.position().top + pinnerHeight - halfHeight) }, 200, callback);
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
  
  var countMessageBodyParts = function(text)
  {
    if (!text.length) return 0;

    var isSeptets = /^[\u0000-\u007f]*$/.test(text);

    var octets = Math.ceil(isSeptets ? (7/8) * text.length : text.length * 2);

    // 140 octets for whole message, 134 for each part of partial message

    return octets <= 140 ? 1 : Math.ceil(octets / 134);
  }

  var countMessages = function()
  {
    return $(messagesSelector).length
  }

  var findRecipientsByPrefix = function(prefix, where)
  {
    return $(where || $(messagesSelector).find('div.recipients')).find('input.bubble.contact, input.bubble.phone').filter(function() { return this.getAttribute('name').indexOf('][recipients][' + prefix) >= 'mailing['.length })
  }

  var setSendingCounts = function()
  {
    var res = {};

    each(billingPrefixes, function(i, prefix) { res[prefix] = 0 });

    $('section.wrapper > article.message:not(.new)').each(function()
    {
      var article = $(this);
      var parts = parseInt(article.attr('data-parts-amount')) || 1;

      each(billingPrefixes, function(i, prefix)
      {
        var count = parseInt(article.attr('data-recipients-amount-' + prefix));
        if (count) res[prefix] += count * parts;
      })
    })

    each(billingPrefixes, function(i, prefix) { typoNumber(res[prefix], '#sending_' + prefix) });
  }

  $('section.wrapper > article.message').live('amountchange', function(event)
  {
    var article = $(this);

    // those attrs must be set anyway!
    var parts = article.attr('data-parts-amount');
    var recipients = article.attr('data-recipients-amount');

    var text = recipients == 0 ? '0' : (recipients + (parts > 1 ? ('×' + parts) : ''))

    article.find('h1.amount').text(text);

    setSendingCounts();
  });

  var updateMessagesNavigation = function(count, decades, shift, undefined)
  {
    var messages = $(messagesSelector);
    var scrollTop = $doc.scrollTop() - $('div.pinner').outerHeight();

    count = parseInt(count) || messages.length;
    decades = decades == undefined ? Math.floor(Math.log(count) / Math.log(10)) : decades;
    shift = shift || 0;
    if (shift % 10) shift = Math.floor(shift / 10) * 10;

    var divider = Math.pow(10, decades);
    var blocks = Math.min(Math.ceil(count / divider), 10, messages.length - shift);

    var ul = $('div.pinner div.wrapper ul.float-left').empty();
      
    for (var k = 0, wasActive; k < blocks; k++)
    {
      var
        start = shift + k*divider + 1,
        end = Math.min(shift + (k+1)*divider, messages.length);

      var text = start == 1 && divider != 1 ? ('<' + divider) : start;
      
      var link = $('<a/>').append($('<u/>').text(text)).
        attr('href', '#' + start).
        addClass('pseudolink').
        click(function(event)
            {
              event.preventDefault();

              var shift = parseInt(this.getAttribute('href').substr(1)) - 1;
              scrollTo(messages.eq(shift), function(){ (messages.length - shift > 1) && tools.delay(updateMessagesNavigation)(count, Math.max(decades - 1, 0), shift) });

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
          var firstMessage = messages.eq(start - 1);
          var firstMessagePosition = firstMessage && firstMessage.position();

          var afterLastMessage = messages.eq(end);
          var afterLastMessagePositionTop = afterLastMessage.position() ? afterLastMessage.position().top : $doc.outerHeight();
          
          var halfHeight = scrollTop + ($win.outerHeight() / 2);

          if (firstMessagePosition && 
              halfHeight <= afterLastMessagePositionTop &&
              halfHeight > firstMessagePosition.top
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

  $doc.bind('change click', function(event)
  {
    var i = 0, wasRemoval;

    $(messagesSelector).each(function()
    {
      i++;
      var article = $(this) //.parents('article');
      if (wasRemoval) article.find('h1.number').text(i);

      if (parseInt(article.attr('data-parts-amount'))) return;

      if (article.find('div.recipients > input:not([placeholder])').length) return;

      if (article.find(':focus').length) return;

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
  })
  
  $('section.wrapper > article.message:not(.new) > textarea').live('input propertychange', function(event)
  {
    var area = $(this);
    var article = area.parents('article.message');

    var old_amount = article.attr('data-parts-amount');
    var new_amount = countMessageBodyParts(area.val());

    old_amount != new_amount && article.attr('data-parts-amount', new_amount).trigger('amountchange');
  });



  // working w/ recipients

  var fixWidth = function(obj)
  {
    inputs = obj.is && obj.is('input') ? obj : $('div.recipients > input');

    inputs.each(function()
    {
      var input = $(this);

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
    })
  }

  $win.bind('load', fixWidth);
  $doc.bind('ready', fixWidth);

  $doc.ready(function()
  {
    // first, push phone contacts to list as temporary ones
    $('div.recipients > input.phone').each(function()
    {
      var input = $(this);

      var number = tools.sanitizeNumber(input.attr('name').replace(/^mailing\[.*?\]\[recipients\]\[/, '+'));

      Contacts.delay('pushContact')(number);
    })

    // ...and now we must take care about them!
    $('#contacts').bind('contact', function(event, number, name)
    {
      var makePhone = !name;

      findRecipientsByPrefix(number)[makePhone ? 'addClass' : 'removeClass']('phone')[makePhone ? 'removeClass' : 'addClass']('contact').
        val(makePhone ? tools.decorateNumber(number) : name).
        each(function()
        {
          fixWidth(this)
        })
    })
  });

  var lookupContact = function(text, shift)
  {
    tools.ltrim(text);
    if (!text) return;

    shift = shift || 0; 

    var matches = Contacts.suggestContactsByName(text);

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
  };


  var createInput = function(number, where)
  {
     var input = $('<input/>');
     input.addClass('bubble');

     input.attr('name', 'mailing[][recipients][' + number + ']');
     input.attr('type', 'text');

     var name;
     if (name = Contacts.findNameByNumber(number))
     {
       input.val(name);
       input.addClass('contact');
     }
     else
     {
       input.val(tools.decorateNumber(number));
       input.addClass('phone');

       Contacts.delay('pushContact')(number);
     }

     fixWidth(input);

     // TODO: detect message ID using where`s parent article
     where && input.insertBefore($(where));

     return input
  }
  var modifyAmount = function(where)
  {
    var article = where.parents('article.message');
    var recipients = where.parents('div.recipients');

    var amount = recipients.find('input.phone, input.contact').size();

    // 別々にお願いします
    each(billingPrefixes, function(i, prefix)
    {
      article.attr('data-recipients-amount-' + prefix, findRecipientsByPrefix(prefix, recipients).length)
    })

    article.attr('data-recipients-amount', amount).trigger('amountchange');
  }

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input') return;
    
    event.preventDefault();

    var div = $(this);
    div.find('input.new').focus();
  })

  $('article.message > div.recipients > input:not([readonly])').live('keydown keyup input propertychange', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();

    var notEmpty = value.length > 0

    var caretAtStart = caret.start == 0, 
        caretAtEnd   = caret.end == value.length;

    var allSelected  =  notEmpty && caretAtStart && caretAtEnd;

    var dontmatch;
    var down = event.type == 'keydown',
        up = event.type == 'keyup';

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
        if (!down && !dontmatch)
        {
          value = tools.consumeNumbers(value, function(number)
          {
            findRecipientsByPrefix(number, input.parent('div.recipients')).not(input).remove();

            createInput(number, input);
          })

        }
        
        if (!autocomplete && caretAtEnd && up) {  input.val(!down ? tools.decorateValue(value) : value); input.caret(/$/); } 

        if (caretAtEnd)
        {
          // autocomplete shit
          if (up && notEmpty && !tools.wannaBeAPhone(value))
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
    input.val(tools.decorateValue(input.attr('name') ? input.attr('name').replace(/^mailing\[.*?\]\[recipients\]\[/, '+') : input.val()));

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

    var value = input.val().trim();
    if (!value)
    {
      input.parent().length && input.remove()
    }
    else
    {
      var isNumber = tools.phoneRegex.test(value);

      if (isNumber)
      {
        var number = tools.sanitizeNumber(value);

        var name = Contacts.findNameByNumber(number);

        if (!name) Contacts.delay('pushContact')(number);

        findRecipientsByPrefix(number, input.parent('div.recipients')).not(input).remove();

        input.attr('name', 'mailing[][recipients][' + number + ']');

        if (name)
        {
          input.addClass('contact').val(name)
        }
        else
        {
          input.addClass('phone');
        }
        modifyAmount(input);
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
