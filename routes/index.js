var express = require('express');
		router = express.Router(),
		passport = require('passport'),
		jwt = require('../modules/jwt.js');

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index');
});

router.post('/login', passport.authenticate('local', {session: false}), function (req, res) {
	res.json({
		user: req.user,
		token: jwt.sign(req.user)
	});
});

module.exports = router;
