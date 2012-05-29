(function()
{
  var
    cmp = function(x1, x2)
    {
      if (!x1) return -1;
      if (!x2) return  1;

      if (x1 > x2) return  1;
      if (x1 < x2) return -1;

      return 0;
    }
  , stricmp = function(s1, s2)
    {
      s1 = s1 || '';
      s2 = s2 || '';

      return cmp(s1.toLowerCase().trim(), s2.toLowerCase().trim());
    }
  , each = function(array, callback, context)
    {
      for (var i = 0; i < array.length; i++)
      {
        if (callback.apply(context || array, i, array[i]) === false) break;
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
      //while (this.mute);
    },
    sync: function(callback, args, context)
    {
      //this.wait();
      this.mute = true;

      try
      {
        callback.apply(context || this, args);
        this.mute = false;
      }
      catch (e)
      {
        this.mute = false;
        throw e
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
        var i = this.names.length - 1;
        /*
        {
          i += stricmp(this.names[i], name)

          if (stricmp(this.names[i-1], name) < 0 && stricmp(this.names[i+1], name) > 0) break;
        }*/

        this.names.splice(i, 0, name);
        this.numbers.splice(i, 0, number);
      });
    },

    findNameByNumber: function(number)
    {
      this.wait();

      this.names[this.names.indexOf(number)]
    },

    suggestContactsByName: function(text)
    {
      this.wait();

      var matches = [];

      // TODO: more effective search in sorted array instead of simple iteration
      this.names.each(function(i, name)
      {
        if (name && name.toLowerCase().indexOf(text.toLowerCase()) == 0)
        {
          matches.push({ name: name, number: this.numbers[i] })
        }
      });

      return matches;

    }
  }

})()
