// tools for messages editor
(function()
{
  var autocompleteSettings = 
       {
         source: CONTACTS,
         position: { 
           my : "left top",
           offset: "-6 -3",
           at: "left bottom",
           collision: "none" 
         }
       };

  $(document).ready(function(){ $('.recipients input.new').autocomplete(autocompleteSettings); });


  var tools  =
  {
      phoneRegex: /(?:tel:)?\+(7|38)\s*[\(\)]?\d{3,}[\)\(]?\s*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g

    , sanitizeNumber: function(text)
      {
        return '+' + text.replace(/[^\d]/g, '')
      }
    , decorateNumber: function(number)
      {
        var parts = number.match(/\+(\d+)(\d{3})(\d{3})(\d{2})(\d{2})$/)
        return parts && parts[1] && parts[5] ? ('+' + 
                  parts[1] + ' (' +
                    parts[2] + ') ' + 
                      parts[3] + '-' + 
                        parts[4] + '-' +
                          parts[5]) : number
      }
  }

  var createInput = function(number, bubble)
  {
     var input = $('<input/>');
     if (bubble) input.addClass('bubble').addClass('black'); else input.addClass('new');
     input.attr('type', 'text');
     input.val(tools.decorateNumber(number));

     input.autocomplete(autocompleteSettings);

     return input
  }

  // recipient button jumps
  $(window).keydown(function(event)
  {
    if (event.target && event.target.tagName.toLowerCase() != 'body') return;

    var active = $('a.active');
    if (!active.length) return;

    event.preventDefault();

    switch (event.keyCode)
    {
      case 37:
        active.prev().length && active.blur().prev().focus();
        break;
      case 39:
        active.blur().next().focus();
        break;
      case 46:
        active.remove();
        break;
      case 32:
      case 13:
      case 8:
        active.mousedown();
    }
  })

  $('article.message > div.recipients > a').live('mousedown focus', function(event)
  {
    event.preventDefault();

    var link = $(this);
    if (link.hasClass('active') || event.type == 'mousedown')
    {
      var number = tools.sanitizeNumber(link.attr('href'));

      var input = createInput(number, true);

      input.insertBefore(link);
      input.focus();
      link.remove();
    }
    else
    {
      link.addClass('active');
    }
  }).live('blur', function(event)
  { 
    $(this).removeClass('active')
  }).live('click keypress', function(event)
  {
    event.preventDefault();
  });

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input' || tagName == 'a') return;
    
    $(this).find('input.new').focus();
    event.preventDefault();
  })

  $('article.message > div.recipients > input').live('keyup blur', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();
    var allselected = (caret.start == 0 && caret.end == value.length);

    switch (event.keyCode)
    {
      case 37: // <-
        if (caret.start == 0 || allselected)
        {
          event.preventDefault();
          input.blur().prev().focus();
        }
        break;
      case 39: // ->
        if (caret.end == value.length || allselected)
        {
          //
        }
        break;
      default:
        var matches = value.match(tools.phoneRegex);
        if (matches)
        {
          for (var i = 0; i < matches.length; i++)
          {
            var number = tools.sanitizeNumber(matches[i]);

            var link = $('<a></a>');
            link.attr('href', 'tel:' + number);
            link.text(tools.decorateNumber(number));

            link.addClass('bubble').addClass('pseudolink').addClass('black');
            
            link.insertBefore(input);
          }

          var lastMatch = matches[matches.length - 1];

          value = value.substr(value.lastIndexOf(lastMatch) + lastMatch.length);
        }

        input.val(value);
        if (!value.trim().length && /key/.test(event.type))
        { 
          var div = input.parent('div');

          input.remove();

          var input = div.find('input.new');
          (!!input.length ? input : createInput('', false).appendTo(div)).focus();
        }
    }
  })
})()
