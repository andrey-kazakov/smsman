$doc = $(document)
$win = $(window)

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
  , each: function(array, callback, context)
  {
    for (var i = 0; i < array.length; i++)
    {
      if (callback.apply(context || array, [i, array[i]]) === false) break;
    }

    return i
  }
  , delay: function(meth)
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
  }
}

typoNumber = function(number, to)
{
  to = $(to).empty();
  number = number.toString();

  while (number)
  {
    var part = number.substr(-3);
    number = number.substr(0, number.length - 3);

    to.prepend(part);
    if (number) to.prepend($('<span/>').addClass('thinsp'))
  }

  return to
}

scrollTo = function(el, callback, what)
{
  el = $(el);

  var pinnerHeight = what ? 0 : $('div.pinner').outerHeight();
  var halfHeight = ((what ? $(what) : $win).height() / 2) - (el.outerHeight() / 2);

  $(what || 'html,body').animate({ scrollTop: (el.position().top + pinnerHeight - halfHeight) }, 200, callback);
}
