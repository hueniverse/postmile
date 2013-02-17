// Load modules

var Validator = require('validator');
var Crypto = require('crypto');
var Base64 = require('./base64');
var Hapi = require('hapi');


// Validate email address

exports.checkEmail = function (email) {

    try {
        Validator.check(email).len(6, 64).isEmail();
    }
    catch (e) {
        return false;
    }

    return true;
};


// Random string

exports.getRandomString = function (size) {

    var randomSource = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var len = randomSource.length;

    var result = [];

    for (var i = 0; i < size; ++i) {
        result[i] = randomSource[Math.floor(Math.random() * len)];
    }

    return result.join('');
};


// AES256 Symmetric encryption

exports.encrypt = function (key, value) {

    var envelope = JSON.stringify({ v: value, a: exports.getRandomString(2) });

    var cipher = Crypto.createCipher('aes256', key);
    var enc = cipher.update(envelope, input_encoding = 'utf8', output_encoding = 'binary');
    enc += cipher.final(output_encoding = 'binary');

    var result = Base64.encode(enc).replace(/\+/g, '-').replace(/\//g, ':').replace(/\=/g, '');
    return result;
};


exports.decrypt = function (key, value) {

    var input = Base64.decode(value.replace(/-/g, '+').replace(/:/g, '/'));

    var decipher = Crypto.createDecipher('aes256', key);
    var dec = decipher.update(input, input_encoding = 'binary', output_encoding = 'utf8');
    dec += decipher.final(output_encoding = 'utf8');

    var envelope = null;

    try {
        envelope = JSON.parse(dec);
    }
    catch (e) {
        Hapi.log.err('Invalid encrypted envelope: ' + JSON.stringify(e));
    }

    return envelope ? envelope.v : null;
};






