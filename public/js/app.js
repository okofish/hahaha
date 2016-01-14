function vote(type, id, direction) {
  $.ajax({
    method: 'post',
    url: '/vote/' + direction,
    data: {
      type: type,
      id: id
    },
    statusCode: {
    401: function() {
      alert('You\'ve already voted!');
    },
    408: function() {
      alert('Invalid vote direction.');
    }
  }
  }).done(function(count) {
    $('#rating-' + id).text(count);
    $('.joke-rating-button-' + id).addClass('disabled');
    //$('#rating-thanks-' + id).show();
  });
};

$(document).foundation();
