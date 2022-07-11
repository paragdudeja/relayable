const crpto = require('crypto');

class HashService {
    hashOtp(data) {
        return crpto.createHmac('sha256', process.env.HASH_SECRET).update(data). digest('hex');
    }
}

module.exports = new HashService();