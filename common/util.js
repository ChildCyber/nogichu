const crypto = require('crypto');

function randomString() {
    return Math.random().toString(36).substr(5).toUpperCase();
}

function randomToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
    let salt = 'nogizaka46';
    let hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
}

module.exports = {
    'randomString': randomString,
    'randomToken': randomToken,
    'hashPassword': hashPassword,
};