const express = require('express');
const perf = require('execution-time-async')();
const router = express.Router();
perf.config();

/* GET home page . */
router.get('/', ensureAuthenticated, function (req, res, next) {
  res.render('index', { title: 'Members' });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}

module.exports = router;
