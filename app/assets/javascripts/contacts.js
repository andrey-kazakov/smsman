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
  , each = tools.each, delay = tools.delay; // FIXME

  // FIXME
  tools.phoneRegex.test = function(s) { return !!s.match(this) }

  // we must have ready DOM to actually work with contacts

  Contacts =
  {
  }

  var $doc = $(document);
  var $win = $(window);

  $doc.ready(function()
  {
    // necessary UI locations

    var aside = $('aside#contacts').draggable();
    var scroll = aside.find('div.scroll');

    var searchField = aside.find('input[type="search"]');
    var contactList = aside.find('div.list');

    Contacts =
    {
      numbers: [],
      names: [],

      // synchrony stuff
      mute: false,
      wait: function()
      {
        if (this.mute) throw 'async';
      },
      sync: function(callback, args, context)
      {
        try { this.wait(); } catch (e) { return delay('sync').apply(this, args) }
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
          this.pushContact(number, obj[number], true);
        }
      },

      _removeIndex: function(index)
      {
        this.names.splice(index, 1);
        this.numbers.splice(index, 1);

        contactList.children('span').eq(index).remove();
      },

      _mousedown: function(event)
      {
        var span = $(this);
        var input = span.find('input:first');
        var caret = input.caret();

        if (input.is(':focus') && caret.start == caret.end && input.val().length > 0)
        {
          span.draggable('option', 'cancel', 'input');
        }
        else
        {
          span.draggable('option', 'cancel', '');
        }

        input.focus()
      },
      _dragstart: function(event, ui)
      {
        $(this).find('input:first:not([value=""])').blur(); // FIXME

        ui.helper.addClass('dragging');

        var input = ui.helper.find('input:first');
        if (!input.val())
        {
          input.removeClass('contact').addClass('phone').val(tools.decorateNumber(tools.sanitizeNumber(input.attr('name'))));
        }
      },
      _dragstop: function(event, ui)
      {
        ui.helper.removeClass('dragging');

        var input = $(this).find('input:first');
        input.caret(/$/).focus();
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
        span.append($('<a/>').attr('href', 'tel:+' + number).addClass('edit'));

        span.bind('mousedown', this._mousedown);
        span.draggable(
        {
          addClasses: false,
          appendTo: 'body',
          helper: 'clone',
          cancel: '',
          distance: 5,
          handle: 'input',
          snap: 'div.recipients:not(.readonly)',
          snapMode: 'inner',
          start: this._dragstart,
          stop: this._dragstop
        });


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

          $.ajax({ url: '/contacts/' + number + '.json', type: 'DELETE' });

          aside.trigger('contact', [number]);
        })
      },

      pushContact: function(number, name, dontajax)
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

          var send = {};
          send[number] = name;

          !dontajax && name && $.ajax({ url: '/contacts.json', type: 'POST', data: send });

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
    $.ajax({ url: '/contacts.json', dataType: 'json', context: Contacts, success: Contacts.parse });


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
