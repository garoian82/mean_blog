'use strict';

var mongoose = require('mongoose'),
	_ = require('lodash');

var PostSchema = new mongoose.Schema({
	title: String,
	body: String,
	images: [],
	link: String,
	created_at: {type: Date, default: Date.now}
});

mongoose.model('Post', PostSchema);