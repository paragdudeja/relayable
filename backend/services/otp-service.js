const crypto = require('crypto');
const hashService = require('../services/hash-service');

const smsSID = process.env.SMS_SID;
const smsAuthToken = process.env.SMS_AUTH_TOKEN;

const twilio = require('twilio')(smsSID, smsAuthToken, {
    lazyLoading: true
});

class OtpService {
    async generateOtp() {
        const otp = crypto.randomInt(1000, 9999);
        return otp;
    }

    async sendBySms(phone, otp) {
        return await twilio.messages.create({
            to: phone,
            from: process.env.SMS_FROM_NUMBER,
            body: `You RelayAble OTP is ${otp}. Valid for 5 mins.`
        })
    }

    verifyOtp(hashedOtp, data) {
        let computedHash = hashService.hashOtp(data);
        return computedHash === hashedOtp;
    }
}

module.exports = new OtpService();