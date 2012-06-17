// tools for messages editor
(function()
{
  var $doc = $(document);
  var $win = $(window);

  var each = tools.each;

  var billingPrefixes = [];
  if (window['messagesLocale']) for (var prefix in messagesLocale.prefixes) { billingPrefixes.push(prefix) }

  $doc.ready(function()
  {
    // from Russian rubygem
    var translit = function(value)
    {
      if (!window['translitLocale']) return value;

      var ret = '';
      with (translitLocale)
      {
        var matches = value.match(new RegExp(multi_keys.join('|') + '|.', 'g'));

        matches && each(matches, function(index, match)
        {
          if (upper[match] && lower[matches[index + 1]])
          {
            ret += upper[match].charAt(0) + upper[match].chatAt(1).toLowerCase();
          }
          else if (upper[match])
          {
            ret += upper[match]
          }
          else if (lower[match])
          {
            ret += lower[match]
          }
            else
          {
            ret += match
          }
        });
      }

      return ret.replace(/[^\u0000-\u007f]/g, '');
    }

    $('#sender input:first').bind('keyup input propertychange', function(event)
    {
      var input = $(this);
      var value = input.val();

      var lastLetter = value.substr(-1);
      var firstChunk = translit(value.substr(0, value.length - 1));

      input.val(firstChunk + lastLetter).caret(/$/);
    }).bind('blur', function(event)
    {
      var input = $(this);
      var value = input.val();

      input.val(translit(value));
    }).bind('blur keyup input propertychange', function()
    {
      var input = $(this);
      var value = translit(input.val());

      var div = input.parents('#sender');

      var symbolsOk = /^[ -:@-Z_a-z]{1,11}$/.test(value),
          hasLatin  = /[a-z]/i.test(value);

      if (symbolsOk && hasLatin)
      {
        div.removeClass('error').addClass('set')
      }
      else
      {
        div.addClass('error').removeClass('set')
      }
    });

  });

  // working w/ whole messages

  var messagesSelector = 'section.wrapper > article.message:not(.new)'
  
  var countMessageBodyParts = function(text)
  {
    if (!text.length) return 0;

    var isSeptets = /^[\u0000-Z_-z]*$/.test(text);

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
    return $(where || $(messagesSelector).find('div.recipients')).find('input.bubble.contact, input.bubble.phone').filter(function() { return this.getAttribute('name').indexOf('][recipients][' + prefix) >= 'mailing[messages]['.length })
  }

  var setMailingSummary = function()
  {
    var res = {};

    each(billingPrefixes, function(i, prefix) { res[prefix] = 0 });

    $(messagesSelector).each(function()
    {
      var article = $(this);
      var parts = parseInt(article.attr('data-parts-amount')) || 1;

      each(billingPrefixes, function(i, prefix)
      {
        var count = parseInt(article.attr('data-recipients-amount-' + prefix));
        if (count) res[prefix] += count * parts;
      })
    })

    var availPrefixes = [];
    for (var prefix in res) { if (res[prefix]) availPrefixes.push(prefix) }

    var total = $('#total');
    var text = total.find('h3:first').empty();

    text.append($('<span/>').text(messagesLocale.total + ":\u00a0")).append("\u00a0");
    
    var countries = $('<span/>').addClass('countries');

    each(availPrefixes, function(i, prefix)
    {
      var country = $('<span/>').text(messagesLocale.prefixes[prefix] + "\u00a0—\u00a0");
      if (res[prefix])
      {
        countries.append(country.append(typoNumber(res[prefix], '<span/>')));
        if (i < availPrefixes.length - 1) country.append(",\u00a0");
      }
    })

    if (countries.children().length)
    {
      text.append(countries);

      total.removeClass('none').slideDown('fast');
    }
    else
      total.slideUp('fast', function(){ $(this).addClass('none') });
  }

  $(messagesSelector).live('amountchange', function(event)
  {
    var article = $(this);

    // those attrs must be set anyway!
    var parts = article.attr('data-parts-amount');
    var recipients = article.attr('data-recipients-amount');

    var text = recipients == 0 ? '0' : (recipients + (parts > 1 ? ('×' + parts) : ''))

    article.find('h1.amount').text(text);

    setMailingSummary();
  });

  $doc.bind('change click', function(event)
  {
    var i = 0, wasRemoval;

    $(messagesSelector).each(function()
    {
      i++;
      if (i == 1) return;

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

    if (wasRemoval) updateTopNavigation(i);

  });

  var makeDroppable = function(what)
  {
    return $(what).droppable({
      accept: 'span',
      drop: function(event, ui)
      {
        var article = $(this);
        var recipients = article.find('div.recipients:not(.readonly)');

        if (recipients.length)
        {
          var input = ui.helper.find('input:first');

          var number = tools.sanitizeNumber(input.attr('name'));

          recipients.trigger('contact', [number]);
        }
      }
    });
  };

  $doc.ready(function()
  {
    makeDroppable(messagesSelector);
  });

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
    var article = area.parents('article');

    article.clone().hide().insertAfter(article).slideDown('fast');

    var message_id = (new Date()).getTime().toString();
    article.removeClass('new').attr('id', 'message_' + message_id);

    area.attr('placeholder', 'Текст сообщения…').attr('name', 'mailing[messages][' + message_id + '][text]');

    $('<div class="recipients"><input class="new" type="text" placeholder="Получатели…" /></div>').appendTo(article);
    $('<h1 class="bold amount">0</h1>').appendTo(article);

    $('<h1 class="bold number"></h1>').text(countMessages()).insertBefore(area);

    makeDroppable(article);

    updateTopNavigation();
  })
  
  $(messagesSelector).find('textarea').live('input propertychange', function(event)
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

  var modifyAmount = function(where)
  {
    var recipients = where.parents('div.recipients');
    var article = recipients.parents('article.message');

    var amount = recipients.find('input.phone, input.contact').size();

    // 別々にお願いします
    each(billingPrefixes, function(i, prefix)
    {
      article.attr('data-recipients-amount-' + prefix, findRecipientsByPrefix(prefix, recipients).length)
    })

    article.attr('data-recipients-amount', amount).trigger('amountchange');
  }

  var lookupMessageId = function(el)
  {
    return $(el).parents('article.message').attr('id').replace(/^message_/, '')
  }

  var createInput = function(number, where)
  {
    var recipients = where.is('div.recipients') ? where : where.parents('div.recipients');
    if (where.is('div.recipients')) where = where.find('input.new').removeAttr('placeholder');

    findRecipientsByPrefix(number, recipients).not(where).remove();

    var input = $('<input/>');
    input.addClass('bubble');

    input.attr('name', 'mailing[messages][' + lookupMessageId(where) + '][recipients][' + number + ']');
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

    input.insertBefore(where);

    return input
  }

  $(messagesSelector).find('div.recipients:not(.readonly)').live('contact', function(event, number, dontrecalc)
  {
    var input = createInput(number, $(this));

    if (!dontrecalc) modifyAmount(input);
  });

  $doc.ready(function()
  {
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
    
    $('div.recipients > input.phone').each(function()
    {
      var input = $(this);

      var number = tools.sanitizeNumber(input.attr('name').replace(/^.*?\]\[recipients\]\[/, '+'));

      if (!Contacts.findNameByNumber(number)) Contacts.pushContact(number);
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

  $('article.message > div.recipients:not(.readonly)').live('click', function(event)
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

      input.attr('name', 'mailing[messages][' + lookupMessageId(input) + '][recipients][' + data.number + ']').

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
            input.parents('div.recipients').trigger('contact', [number, true]);
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
    input.val(tools.decorateValue(input.attr('name') ? input.attr('name').replace(/^.*?\]\[recipients\]\[/, '+') : input.val()));

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

        input.attr('name', 'mailing[messages][' + lookupMessageId(input) + '][recipients][' + number + ']');

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
