var express = require('express'),
 		router = express.Router(),
 		mongoose = require('mongoose'),
 		User = mongoose.model('User'),
 		_ = require('lodash'),
 		jwt = require('../modules/jwt.js');

router.param('userId', function (req, res, next, userId) {
	User.findById(userId, function (err, user) {
		if (err) return res.sendstatus(400)
		req.user = user;
		next();
	});
});

// Get Users 
router.route('/')
	.get(function (req, res) {
		User.find(function (err, users) {
			res.json(users);
		});
	})
	.post(function (req, res) {
		var user = new User(req.body);
		user.save(function (err) {
			res.json(user);
		});
	});

router.route('/:userId')
  .put(function (req, res) {
    User.findById(req.params.userId, function (err, user) {
      _.merge(user, _.omit(req.body, ['password']));

      if (req.body.password) {
        user.password = req.body.password;
      }

      user.save(function (err) {
        res.sendStatus(200);
      });
    });
  })
  .delete(function (req, res) {
    User.findByIdAndRemove(req.params.userId, function (err) {
      if (err) return res.status(400).json(err);
      res.sendStatus(200);
    });
  });

module.exports = router;
