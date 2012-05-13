// tools for messages editor
(function()
{

  var tools  =
  {
      phoneRegex: /(?:tel:)?\+\d+(?:\s*(?:\(\d{3}\)\s*)*\d{3}(?:-|\s)*\d{2}(?:-|\s)*\d{2})?/g
    //
  }

  $('article.message > div.recipient > input').live('keyup mouseup', function(event)
  {
    var input = $(this);
    var value = input.val();
    var match = value.match(tools.phoneRegex);

    //
  })
})()
