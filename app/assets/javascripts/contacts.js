(function()
{
  var
    cmp = function(x1, x2)
    {
      if (x1 == x2) return 0;

      if (!x2) return  1;
      if (!x1) return -1;

      if (x1 > x2) return  1;
      if (x1 < x2) return -1;
    }
  , stricmp = function(s1, s2)
    {
      s1 = s1 || '';
      s2 = s2 || '';

      return cmp(s1.toLowerCase(), s2.toLowerCase());
    }
  , each = function(array, callback, context)
    {
      for (var i = 0; i < array.length; i++)
      {
        if (callback.apply(context || array, [i, array[i]]) === false) break;
      }

      return i
    }
  , delay = function(meth)
    {
      var th = this;

      return function()
      {
        var args = arguments;

        setTimeout(function()
        {
          meth.apply(th, args);
        }, 1);
      }
    };

  tools  =
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
    , consumeNumbers: function(value, callback)
      {
        var matches = value.match(tools.phoneRegex);

        if (matches)
        {
          var lastMatch = matches[matches.length - 1];
          value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);

          each(matches, function(i, match)
          {
            callback(tools.sanitizeNumber(matches[i]));
          });
        }

        return value
      }
    , each: each
    , delay: delay

  }
  // FIXME: ябудучитатьдокументациюпреждечемюзатьдефолтныеметоды
  tools.phoneRegex.test = function(s) { return !!s.match(this) }

  // we must have ready DOM to actually work with contacts

  var stubQueue = {};
  Contacts =
  {
    parse: function(obj)
    {
      stubQueue = obj
    },
    pushContact: function(number, name)
    {
      stubQueue[number] = name
    }
  }

  var $doc = $(document);
  var $win = $(window);

  $doc.ready(function()
  {
    // necessary UI locations

    var aside = $('aside#contacts');
    var scroll = aside.find('div.scroll');

    var searchField = aside.find('input[type="search"]');
    var contactList = aside.find('div.list');

    Contacts =
    {
      numbers: [],
      names: [],

      // synchrony stuff
      // it doesn't fucking synchronize... waaai?!
      mute: false,
      wait: function()
      {
        while (this.mute);
      },
      sync: function(callback, args, context)
      {
        this.wait();
        this.mute = true;

        try
        {
          return callback.apply(context || this, args);
        }
        catch (e)
        {
          throw e
        }
        finally
        {
          this.mute = false;
        }
      },
      delay: function(meth) // TODO: use delay above
      {
        var th = this;

        return function()
        {
          var args = arguments;

          setTimeout(function()
          {
            th[meth].apply(th, args);
          }, 1);
        }
      },

      parse: function(obj)
      {
        this.sync(function()
        {
          contactList.empty();
          this.numbers = []
          this.names = []
        });

        for (var number in obj)
        {
          this.pushContact(number, obj[number]);
        }
      },

      _removeIndex: function(index)
      {
        this.names.splice(index, 1);
        this.numbers.splice(index, 1);

        contactList.children('span').eq(index).remove();
      },

      _insertIndex: function(index, number, name)
      {
        this.names.splice(index, 0, name);
        this.numbers.splice(index, 0, number);

        var span = $('<span/>');
        span.append
        (
          $('<input/>').
            attr('type', 'text').
            attr('name', number).
            val(name || tools.decorateNumber(number)).
            addClass('bubble').
            addClass(name ? 'contact' : 'phone')
        );
        span.append($('<a/>').attr('href', '#').addClass('edit'));

        var spans = contactList.children('span');
        if (spans.length > index)
          span.insertBefore(spans.eq(index));
        else
          span.appendTo(contactList);
      },

      dropContact: function(number)
      {
        this.sync(function()
        {
          this._removeIndex(this.numbers.indexOf(number));

          aside.trigger('contact', [number]);
        })
      },

      pushContact: function(number, name)
      {
        return this.sync(function()
        {
          var old_index = this.numbers.indexOf(number);
          if (old_index > -1)
          {
            // renaming means reordering both of arrays and UI...
            this._removeIndex(old_index)
          }

          var index = each(this.names, function(i, current_name)
          {
            if (!name) return true;
            if (!current_name) return false;

            var diff = stricmp(name, current_name);

            if (diff == 0)
              diff = cmp(number, this.numbers[i]);

            if (diff < 0)
            {
              return false
            }
          }, this);

          this._insertIndex(index, number, name);

          // ...and now call event handler
          
          aside.trigger('contact', [number, name]);

          return index;
        });
      },

      findIndexByNumber: function(number)
      {
        return this.numbers.indexOf(number);
      },

      findNameByNumber: function(number)
      {
        return this.names[this.findIndexByNumber(number)]
      },

      suggestContactsByName: function(text, ui)
      {
        var matches = [], hit;

        this.sync(function()
        {
          if (text)
          {
            var spans = ui && contactList.children('span').addClass('none');

            each(this.names, function(i, name)
            {
              if (hit && stricmp((name || '').substr(0, text.length), text) != 0) return false;

              if (stricmp(name, text) > -1 && stricmp((name || '').substr(0, text.length), text) == 0)
              {
                matches.push({ name: name, number: this.numbers[i] })
                hit = true

                ui && spans.eq(i).removeClass('none');
              }
            }, this);
          }
          else
          {
            ui && contactList.children('span').removeClass('none');
            each(this.names, function(i, name)
            {
              matches.push({ name: name, number: this.numbers[i] })
            }, this)
          }
        });

        return matches;
      }
    }
    Contacts.parse(stubQueue);
    delete stubQueue;

    // UI functions here
    searchField.bind('keyup keyrepeat change search', function()
    {
      Contacts.suggestContactsByName(tools.ltrim(searchField.val()), true);
    }).bind('keydown', function(event)
    {
      if (event.keyCode == 40)
      {
        event.preventDefault();

        aside.find('div.list input:first').focus()
      }
    });

    var fixScroll = function()
    {
      scroll.css('max-height', $win.height() * 0.75);
    };
    
    $win.resize(fixScroll);

    $('#toggleContacts').add(aside.find('a.close')).bind('click keydown', function(event)
    {
      if (/key/.test(event.type))
      {
        switch (event.keyCode)
        {
          case 32:
          case 13:
            break;
          default:
            return;
        }
      }
      var contactsLink = $('#toggleContacts');

      fixScroll();

      contactsLink.toggleClass('active');
      aside.toggleClass('none');

      event.preventDefault();
      return false
    })

    var addField = aside.find('div.add input');

    addField.bind('input propertychange', function(event)
    {
      var input = $(this);

      input.val(tools.consumeNumbers(input.val(), function(number)
      {
        Contacts.pushContact(number);
      }));
    }).bind('keyup', function(event)
    {
      var input = $(this);
      var value = input.val();
      var caret = input.caret();

      var caretAtEnd = value.length == caret.start;

      if (caretAtEnd && event.keyCode != 8) { input.val(tools.decorateValue(value)); input.caret(/$/); }
    }).bind('keydown', function(event)
    {
      if (event.keyCode == 38)
      {
        event.preventDefault();

        aside.find('div.list input:last').focus()
      }
    });

    contactList.find('input').live('keydown', function(event)
    {
      var input = $(this);
      var span = input.parents('span');

      var number = tools.sanitizeNumber(input.attr('name'))

      var isContact = input.hasClass('contact');

      var value = input.val();

      switch (event.keyCode)
      {
        case  8:
          if (value) break;
        case 38:
          event.preventDefault();

          if (span.prev().length)
          {
            span.prev().find('input').focus()
          }
          else
          {
            searchField.focus();
          }
          break;
        case 46:
          if (value) break;
        case 13:
        case 40:
          event.preventDefault();

          if (span.next().length)
          {
            span.next().find('input').focus()
          }
          else
          {
            addField.focus();
          }
          break;
      }
    }).live('blur', function(event)
    {
      var input = $(this);

      var number = tools.sanitizeNumber(input.attr('name'))
      var old_name = Contacts.findNameByNumber(number);

      var isContact = input.hasClass('contact');

      var value = input.val();

      if (isContact)
      {
        if (!value || value != old_name)
          Contacts.delay('pushContact')(number, value);
      }
      else
      {
        if (!value)
        {
          Contacts.delay('dropContact')(number);
        }
        else if (!tools.phoneRegex.test(value))
        {
          delay(input.caret({ start: 0, end: value.length }).focus)();
        }
        else
        {
          var new_number = tools.sanitizeNumber(value);

          if (new_number != number)
          {
            Contacts.dropContact(number);
            Contacts.delay('pushContact')(new_number, old_name);
          }
          else
          {
            input.removeClass('phone').addClass('contact').val(old_name);
          }
        }
      }
    }).live('focus', function(event)
    {
      var input = $(this);
      if (input.hasClass('contact')) return;

      var number = tools.sanitizeNumber(input.attr('name'))

      var value = input.val();

      if (!Contacts.findNameByNumber(number)) input.removeClass('phone').addClass('contact').val('')
    });

    contactList.find('a.edit').live('click keydown', function(event)
    {
      var span = $(this).parents('span');
      var input = span.find('input');

      event.preventDefault();

      input.removeClass('contact').addClass('phone');
      input.val(tools.decorateValue(tools.sanitizeNumber(input.attr('name'))));
      input.caret(/$/).focus();
    });
  })
})()
