var express = require('express');
var router = express.Router();
var db = require('../db');
const { default: axios } = require('axios');

function fetchTodos(req, res, next) {
  db.all('SELECT * FROM todos', [], function (err, rows) {
    if (err) { return next(err); }

    var todos = rows.map(function (row) {
      return {
        id: row.id,
        title: row.title,
        completed: row.completed == 1 ? true : false,
        created_at: row.created_at,
        updated_at: row.updated_at,
        synchronized: row.synchronized,
        url: '/' + row.id
      }
    });
    res.locals.todos = todos;
    res.locals.activeCount = todos.filter(function (todo) { return !todo.completed; }).length;
    res.locals.completedCount = todos.length - res.locals.activeCount;
    next();
  });
}

/* GET home page. */
router.get('/', fetchTodos, function (req, res) {
  res.render('index', { filter: '', query: '' });
});

router.get('/active', fetchTodos, function (req, res, next) {
  res.locals.todos = res.locals.todos.filter(function (todo) { return !todo.completed; });
  res.locals.filter = 'active';
  res.render('index');
});

router.get('/completed', fetchTodos, function (req, res, next) {
  res.locals.todos = res.locals.todos.filter(function (todo) { return todo.completed; });
  res.locals.filter = 'completed';
  res.render('index');
});






router.post('/', function (req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function (req, res, next) {
  if (req.body.title !== '') { return next(); }
  return res.redirect('/' + (req.body.filter || ''));
}, function (req, res, next) {
  db.run('INSERT INTO todos (title, completed, synchronized) VALUES (?, ?, ?)', [
    req.body.title,
    req.body.completed == true ? 1 : null,
    0
  ], function (err) {
    if (err) { return next(err); }


    const tododate = new Date();
    tododate.setHours(tododate.getHours() + 1);

    const newTodo = {
      id: this.lastID,
      title: req.body.title,
      completed: req.body.completed == true ? 1 : 0,
      created_at: tododate,
      updated_at: null,
    };

    axios.post('https://postman-echo.com/post', newTodo)
      .then(response => {
        // Update the synchronized field to 1 if the request is successful
        db.run('UPDATE todos SET synchronized = ? WHERE id = ?', [1, newTodo.id], function (err) {
          if (err) { return next(err); }
          console.log('Todo successfully synchronized');
          res.redirect('/' + (req.body.filter || ''));  // Redirect after success
        });
      })
      .catch(error => {
        console.error('Error sending todo to Postman Echo:', error);
        res.redirect('/' + (req.body.filter || ''));  // Redirect even if there's an error
      });
  });
});






router.post('/:id(\\d+)', function (req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function (req, res, next) {
  if (req.body.title !== '') { return next(); }
  db.run('DELETE FROM todos WHERE id = ?', [
    req.params.id
  ], function (err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
}, function (req, res, next) {
  //Updating the specific todo with the timestamp when it has been updated
  db.run('UPDATE todos SET title = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    req.body.title,
    req.body.completed !== undefined ? 1 : null,
    req.params.id
  ], function (err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)/delete', function (req, res, next) {
  db.run('DELETE FROM todos WHERE id = ?', [
    req.params.id
  ], function (err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/toggle-all', function (req, res, next) {
  db.run('UPDATE todos SET completed = ?', [
    req.body.completed !== undefined ? 1 : null
  ], function (err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/clear-completed', function (req, res, next) {
  db.run('DELETE FROM todos WHERE completed = ?', [
    1
  ], function (err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});




router.get('/search', fetchTodos, function (req, res) {
  const query = req.query.q;
  if (query) {
    res.locals.todos = res.locals.todos.filter(todo => todo.title.toLowerCase().includes(query.toLowerCase()));
  }
  res.locals.filter = 'search';
  res.locals.query = query;  // Sending the query value to the http
  res.render('index');
});





module.exports = router;
