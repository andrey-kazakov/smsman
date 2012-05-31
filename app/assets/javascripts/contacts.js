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
    };


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
      for (var number in obj)
      {
        this.pushContact(number, obj[number]);
      }
    },

    pushContact: function(number, name)
    {
      this.sync(function()
      {
        for (var i = this.names.length - 1; i >= 0; i--)
        {
          if (stricmp(this.names[i], name) < 0) { i++; break; }
        }

        this.names.splice(i, 0, name);
        this.numbers.splice(i, 0, number);
      });
    },

    findNameByNumber: function(number)
    {
      this.wait();

      return this.names[this.numbers.indexOf(number)]
    },

    suggestContactsByName: function(text)
    {
      this.wait();

      var matches = [], hit;

      each(this.names, function(i, name)
      {
        if (hit && stricmp(name.substr(0, text.length), text) != 0) return false;

        if (stricmp(name, text) > -1 && stricmp(name.substr(0, text.length), text) == 0)
        {
          matches.push({ name: name, number: this.numbers[i] })
          hit = true
        }
      }, this);

      return matches;
    }
  }

  // UI functions here
  $(document).ready(function()
  {
    var aside = $('aside#contacts');
    var searchField = aside.find('input[type="search"]');

    var findContacts = function()
    {
      var list = aside.find('div.list').empty();
      var contacts = Contacts.suggestContactsByName(searchField.val().replace(/^\s*/, ''));

      each(contacts, function(i, contact)
      {
        var span = $('<span/>');

        span.append
        (
          $('<input/>').
            attr('type', 'text').
            attr('name', contact.number).
            val(contact.name).
            addClass('bubble').
            addClass('contact')
        );
        span.append($('<a/>').attr('href', '#').addClass('edit'));

        list.append(span);
      });
    }

    searchField.bind('keyup keyrepeat change search', findContacts);

    var contactsToggler = function(event)
    {
      var contactsLink = $('#toggleContacts');

      var gonnaShow = aside.hasClass('none');

      if (gonnaShow)
      {
        // so, what we gonna do to show our nice contact list?
        // at first, we must tend to keep contact list actual with server <- TODO
        // at second, we must just find required contacts according to current search field value...
        findContacts();
      }

      contactsLink.toggleClass('active');
      aside.toggleClass('none');

      event.preventDefault();
      return false
    }

    $('#toggleContacts').add(aside.find('a.close')).click(contactsToggler)
  })

})()
