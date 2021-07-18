const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GM_USERNAME,
        pass: process.env.GM_PASSWORD
    }
}));

const sendMail = (mailOptions, force = false) => {
    return new Promise((resolve, reject) => {
        User.findOne({ emailAddress: mailOptions.to },
            'emailAddress isNotify')
            .then(async (to) => {
                if (to.isNotify || force) {
                    await transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            resolve({ status: false, message: error.message });
                        } else {
                            status = true;
                            console.log('Email sent: ' + info.response);
                            resolve({ status: true });
                        }
                    });
                }
            })
            .catch(error => {
                console.log(error);
                resolve({ status: false, message: error.message });
            })
    })
}

module.exports = {
    sendMail
}