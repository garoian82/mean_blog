var express = require('express'),
		router = express.Router(),
		mongoose = require('mongoose'),
		Post = mongoose.model('Post'),
		multer = require('multer'),
		upload = multer({dest: "uploads"}),
		AWS = require('aws-sdk'),
		fs = require('fs'),
		async = require('async'),
		_ = require('lodash');
		jwt = require('../modules/jwt.js');

router.param('postId', function (req, res, next, postId) {
	Post.findById(postId, function (err, post) {
		if (err) return res.sendstatus(400)
		req.post = post;
		next();
	});
});

// Get Blog posts
router.route('/')
	.get(function (req, res) {
		Post.find(function (err, posts) {
			res.json(posts);
		});
	})
	.post(jwt.protect, upload.array('blogImages'), function (req, res) {	
		var post = new Post(req.body);
		if (req.files && req.files.length) post.images = _.map(req.files, 'originalname');
		
		post.save(function (err, post) {
			if (!req.files) return res.json(post);

			async.series(_.map(req.files, function (file) {
				return function (callback) {
					var bucket = new AWS.S3({
						params: {
							Bucket: 'ians-blog'
						},
						accessKeyId: process.env.ACCESSKEYID,
            secretAccessKey: process.env.SECRETACCESSKEY
					}),
					params;

				fs.readFile(file.path, function (err, data) {
					params = {
						Key: file.originalname,
						Body: data
					};

					bucket.upload(params, function (err, data) {
						if (err) {
							callback(err);
						} else {
							callback();
						}
					});
				});
			};
		}), function () {
			res.json(post);
		});
	});
});

router.route('/:postId')
	.put(jwt.protect, function (req, res) {
		Post.findById(req.params.postId, function (err, post) {
			post.save(function (err) {
				res.sendStatus(200)
			});  
		});
	})
	.delete(jwt.protect, function (req, res) {
		Post.findByIdAndRemove(req.params.postId, function (err) {
			if (err) return res.status(400).json(err);
			res. sendstatus(200);
		});
	});

module.exports = router;