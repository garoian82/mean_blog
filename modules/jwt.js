
var jwt = require('jsonwebtoken'),
  _ = require('lodash'),
  secret = process.env.JWT_SECRET,
  jwtDefaults = {};

/**
 * Sign a new token.
 *
 * @param payload
 * @param options
 */
function sign(payload, options) {
  return jwt.sign(payload, secret, _.extend(jwtDefaults, options || {}));
}

function protect(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(400).json({message: 'Must provide authorization token.'});
  }

  //format of a token looks like:
  // Token asfdkhasldfh8asfo8ho8ehofihialhfelsaeflaj
  var token = req.headers.authorization.split(' ')[1],
    decoded;

  try {
    decoded = jwt.verify(token, secret);
  } catch(err) {
    decoded = null;
  }

  if (!decoded) {
    return res.status(400).json({message: 'Could not decode user token.'});
  }

  req.user = decoded;
  next();
}

module.exports = {
  sign: sign,
  protect: protect
};