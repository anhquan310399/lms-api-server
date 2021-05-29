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
    let status = false;
    let message = "";
    User.findOne({ emailAddress: mailOptions.to },
        'emailAddress isNotify')
        .then(to => {
            if (to.isNotify || force) {
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        message = error.message;
                    } else {
                        status = true;
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        })
        .catch(error => {
            console.log(error);
            message = error.message;
        });
    return { status, message };
}

module.exports = {
    sendMail
}