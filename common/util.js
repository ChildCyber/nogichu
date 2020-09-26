const crypto = require('crypto');

function randomString() {
    return Math.random().toString(36).substr(5).toUpperCase();
}

function randomToken(length) {
    return crypto.randomBytes(length ? length : 32).toString('hex');
}

function hashPassword(password) {
    let salt = 'nogizaka46';
    let hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
}

function maskEmail(email) {
    let emailArr = email.split('@');
    return emailArr[0].slice(0, emailArr[0].length - 4) + '****@' + emailArr[1];
}

function maskNumber(phone) {
    return phone.slice(0, 3) + '******' + phone.substring(9);
}

module.exports = {
    'randomString': randomString,
    'randomToken': randomToken,
    'hashPassword': hashPassword,
    'maskEmail': maskEmail,
    'maskNumber': maskNumber,
};