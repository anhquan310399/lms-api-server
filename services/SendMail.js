const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const mongoose = require("mongoose");
const User = mongoose.model("User");
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

const sendMail = (mailOptions) => {
    User.findOne({ emailAddress: mailOptions.to },
            'emailAddress isNotify')
        .then(to => {
            if (to.isNotify) {
                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        })
        .catch(error => {
            console.log(error);
        });
}

module.exports = {
    sendMail
}