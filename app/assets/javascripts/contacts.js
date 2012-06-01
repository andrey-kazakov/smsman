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
  }

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

  $(document).ready(function()
  {
    // necessary UI locations

    var aside = $('aside#contacts');
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
        while (this.mute);
      },
      sync: function(callback, args, context)
      {
        this.wait();
        this.mute = true;

        try
        {
          callback.apply(context || this, args);
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
        this.sync(function()
        {
          var old_index = this.numbers.indexOf(number);
          if (old_index > -1 && this.names[old_index] != name)
          {
            // renaming means reordering both of arrays and UI...
            this._removeIndex(old_index)
          }

          var index = each(this.names, function(i, current_name)
          {
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

        });
      },

      findNameByNumber: function(number)
      {
        this.wait();

        return this.names[this.numbers.indexOf(number)]
      },

      suggestContactsByName: function(text, ui)
      {
        var matches = [], hit;

        this.sync(function()
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
        });

        return matches;
      }
    }
    Contacts.parse(stubQueue);
    delete stubQueue;

    // UI functions here
    var findContacts = function()
    {
      Contacts.suggestContactsByName(tools.ltrim(searchField.val()), true);
    }

    searchField.bind('keyup keyrepeat change search', findContacts);

    var contactsToggler = function(event)
    {
      var contactsLink = $('#toggleContacts');

      contactsLink.toggleClass('active');
      aside.toggleClass('none');

      event.preventDefault();
      return false
    }

    $('#toggleContacts').add(aside.find('a.close')).click(contactsToggler)
  })

})()
