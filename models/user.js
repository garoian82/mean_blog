'use strict';

var mongoose = require('mongoose'),
		bcrypt = require('bcrypt-nodejs'),
		_ = require('lodash');

var UserSchema = new mongoose.Schema({
		firstName: String,
		lastName: String,
		email: String,
		password: String,
    created_at: {type: Date, default: Date.now}
});

UserSchema.pre('save', function preSave(next) {
  var user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function () {
    }, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.validPassword = function validPassword(password, cb) {
  return bcrypt.compare(password, this.password, cb);
};

UserSchema.methods.toJSON = function () {
  return _.omit(this.toObject(), ['password']);
};

mongoose.model('User', UserSchema);