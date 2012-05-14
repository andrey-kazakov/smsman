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
     input.attr('size', Math.max(input.val().length - 2, 1));

     input.autocomplete(autocompleteSettings);

     return input
  }

  $('article.message > div.recipients > a').live('keydown', function(event)
  {
    var link = $(this);

    switch (event.keyCode)
    {
      case 37:
        event.preventDefault();
        link.prev().length && link.blur().prev().focus();
        return;
      case 39:
        event.preventDefault();
        link.next().length && link.blur().next().focus();
        return;
      case 46:
        link.remove();
        return;
    }

    var number = tools.sanitizeNumber(link.attr('href'));

    var input = createInput(number, true);

    input.insertBefore(link);
    input.focus();

    link.remove();
  }).live('mousedown click', function(event)
  {
    event.preventDefault();
    this.focus();
    return false
  });

  $('article.message > div.recipients').live('click', function(event)
  {
    if (!event.target) return;

    var tagName = event.target.tagName.toLowerCase();
    if (tagName == 'input' || tagName == 'a') return;
    
    event.preventDefault();
    $(this).find('input.new').focus();
  })

  $('article.message > div.recipients > input').live('keyup blur', function(event)
  {
    var input = $(this);
    var value = input.val();
    var caret = input.caret();
    var allselected = (caret.start == 0 && caret.end == value.length);
    var dontmatch;

    switch (event.keyCode)
    {
      case 37: // <-
        if (caret.start == 0 || allselected)
        {
          event.preventDefault();
          input.prev().length && input.blur().prev().focus();
        }
        break;
      case 39: // ->
        if (caret.end == value.length || allselected)
        {
          event.preventDefault();
          input.next().length && input.blur().next().focus();
        }
        break;
      case 8: // Backspace
        if (allselected)
        {
          value = '';
        }
        if (caret.start == 0)
        {
          event.preventDefault();
          input.blur().prev().focus();
        }
        dontmatch = true;
      case 32: // Space
        dontmatch = true;
      default:
        var matches = value.match(tools.phoneRegex);
        if (!dontmatch && matches)
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
        input.attr('size', Math.max(input.val().length - 2, 1));

        if (!value.trim().length && /key/.test(event.type))
        { 
          var div = input.parent('div');

          input.remove();

          //placeholder = div.children().length ? '' : 'Получатели…'

          input = div.find('input.new');
          (!!input.length ? input : createInput('', false).appendTo(div)) //.attr('placeholder', placeholder);
        }
        input.focus()
    }
  }).live('keydown', function(event)
  {
    var input = $(this);

    input.attr('size', Math.max(input.val().length - 2, 1));
  });
})()
