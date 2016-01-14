mysql = require('mysql');

var port = (process.env.VCAP_APP_PORT || 80);
var config = {
  host: process.env.JOKES_HOST || 'jesse.ws',
  database: process.env.JOKES_DB || 'jokes',
  user: process.env.JOKES_USER || 'jokes_user',
  password: process.env.JOKES_PASSWORD || 'correcthorsebatterystaple'
}

var connection = mysql.createConnection(config);

connection.connect();

express = require('express');
app = express();

bodyParser = require('body-parser');
cookieParser = require('cookie-parser');

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', function(req, res) {
  var itemsPerPage = 20;
  var frontPagePages = 5;
  var type = req.query.type && req.query.type >= 1 && req.query.type <= 2 ? parseInt(req.query.type) : 2;
  var page = req.query.page && req.query.page >= 1 && req.query.page <= frontPagePages ? parseInt(req.query.page) : 1;
  
  // TODO: consider adding rand() as a second sort method. this gives varying front page results when there are few votes, but it invalidates caches.
  connection.query('SELECT * FROM type? ORDER BY rating DESC LIMIT ? OFFSET ?', [type, itemsPerPage, (page - 1) * itemsPerPage], function(err, rows, fields) {
    if (err) throw err;

    res.render('home', {
      jokes: rows,
      itemsPerPage: itemsPerPage,
      frontPagePages: frontPagePages,
      page: page,
      type: type,
      cookies: req.cookies
    })
  });
})

app.get('/random', function(req, res) {
  var type = req.query.type && req.query.type >= 1 && req.query.type <= 2 ? parseInt(req.query.type) : 2;
  connection.query('SELECT * FROM type? ORDER BY rand() LIMIT 1', [type], function(err, rows, fields) {
    if (err) throw err;

    res.redirect('/joke/' + rows[0].id + '?type=' + type)
  });
})

app.get('/joke/:id', function(req, res) {
  var type = req.query.type && req.query.type >= 1 && req.query.type <= 2 ? parseInt(req.query.type) : 2;
  var id = req.params.id && req.params.id >= 1 ? parseInt(req.params.id) : 1;
  connection.query('SELECT * FROM type? WHERE id = ? LIMIT 1', [type, id], function(err, rows, fields) {
    if (err) throw err;

    res.render('joke', {
      type: type,
      joke: rows[0],
      cookies: req.cookies
    })
  });
})

app.post('/vote/:direction', function(req, res) {
  if (!req.body.id) {
    res.status(406);
    res.send('no id specified')
  }
  var type = req.body.type && req.body.type >= 1 && req.body.type <= 2 ? parseInt(req.body.type) : 2;
  var id = req.body.id && req.body.id >= 1 ? parseInt(req.body.id) : 1;
  var voted = (req.cookies['voted' + type] || '').split(',');
  if (voted.indexOf(id.toString()) == -1) {
    res.cookie('voted' + type, voted.concat([id.toString()]).join(','))
    switch (req.params.direction) {
    case 'up':
      connection.query('UPDATE type? SET rating = rating + 1 WHERE id = ?', [type, id], function(err) {
        if (err) throw err;
        connection.query('SELECT rating FROM type? WHERE id = ?', [type, id], function(err, rows, fields) {
          if (err) throw err;
          res.send(rows[0].rating.toString());
        });
      });
      break;
    case 'down':
      connection.query('UPDATE type? SET rating = rating - 1 WHERE id = ?', [type, id], function(err) {
        if (err) throw err;
        connection.query('SELECT rating FROM type? WHERE id = ?', [type, id], function(err, rows, fields) {
          if (err) throw err;
          res.send(rows[0].rating.toString());
        });
      });
      break;
    default:
      res.status(406);
      res.send('invalid direction')
    }
  } else {
    res.status(401)
    res.send('already voted!')
  }
})

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
