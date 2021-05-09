const mongoose = require("mongoose");
const User = mongoose.model("User");
const { verifyGoogle, verifyFacebook } = require('../../handlers/verifySocialHandler');
const { HttpNotFound, HttpUnauthorized, HttpBadRequest, HttpInternalServerError } = require('../../utils/errors');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');
const { MailOptions } = require('../../utils/mailOptions');
const { sendMail } = require('../../services/SendMail');
const moment = require("moment");

exports.register = async (req, res) => {
    const user = new User({
        code: req.body.username,
        password: req.body.password,
        idPrivilege: PRIVILEGES.REGISTER,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: STATUS.NOT_ACTIVATED
    });
    await user.save();

    res.json({
        success: true,
        message: 'Please login via email to activate account first!'
    });
}

exports.getForgotPasswordAccount = async (req, res) => {
    const { email } = req.body;
    const account = await User.findOne({
        emailAddress: email,
        status: STATUS.ACTIVATED
    }, DETAILS.ACCOUNT);
    if (!account) {
        throw new HttpNotFound();
    }
    res.json({
        success: true,
        account: account
    })
}

exports.requestResetPassword = async (req, res) => {
    const user = await User.findOne({ emailAddress: req.body.emailAddress });
    if (!user) {
        throw new HttpNotFound('Search returns no results. Please try again with other information.');
    }
    const date = user.resetToken.date;
    if (date) {
        const duration = moment.duration(moment(new Date()).diff(date));
        const minutes = duration.asMinutes();
        if (minutes <= 30) {
            throw new HttpUnauthorized('You do have to wait 30 minutes after each requesting to reset your password');
        }
    }
    const token = user.generateAuthToken('30m');
    const url = `${req.headers['origin']}/password/reset/${token}`;

    const mailOptions = new MailOptions({
        subject: '[Account LMS HCMUTE] - Reset password',
        to: user.emailAddress,
        html: `Please follow this link to reset your password <a href="${url}">"${url}"</a>`
    })
    sendMail(mailOptions);
    user.resetToken = { token, date: new Date() };
    await user.save();
    res.json({
        success: true,
        message: 'Check your email to get link reset password!'
    })
}

exports.resetPassword = async (req, res) => {
    const user = req.user;
    const token = req.header('Authorization').replace('Bearer ', '');
    if (user.resetToken?.token !== token) {
        throw new HttpUnauthorized('Your request has been expired!');
    }
    user.password = req.body.password;
    user.resetToken = { ...user.resetToken, token: null };
    await user.save();
    res.json({
        success: true,
        message: "Reset password successfully!"
    })

}

exports.update = async (req, res) => {
    const user = req.user;
    user.lastName = req.body.lastName || user.lastName;
    user.firstName = req.body.firstName || user.firstName;
    user.urlAvatar = req.body.urlAvatar || user.urlAvatar;
    user.isNotify = req.body.isNotify || user.isNotify;
    await user.save();

    res.json({
        user: await User.findById(user._id, DETAILS.DETAIL)
    })
};

exports.updatePassword = async (req, res) => {
    const user = req.user;
    const isAuth = user.comparePassword(req.body.password);
    if (!isAuth) {
        throw new HttpBadRequest('Password is not valid');
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({
        success: true,
        message: `Update password successfully`,
    });
};

exports.authenticate = async (req, res) => {
    const user = await User.findOne({ code: req.body.code });
    if (!user) {
        throw new HttpNotFound('Authentication failed. User not found');
    }

    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized('Your account has been suspended!')
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        throw new HttpUnauthorized('Please login via email to activate  account first!');
    }

    const validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
        throw new HttpBadRequest('Authentication failed. Wrong password!');
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: await User.findById(user._id, DETAILS.DETAIL),
        type: 'authenticate',
        token: token
    });
}

exports.getInfo = async (req, res) => {
    const user = req.user;
    res.json({
        info: await User.findById(user._id, DETAILS.DETAIL)
    });
}

exports.authenticateGoogleToken = async (req, res) => {
    const userToken = req.body.token
    const payload = await verifyGoogle(userToken);
    const userEmail = payload.email;
    const user = await User.findOne({ emailAddress: userEmail }, DETAILS.STATUS);

    if (!user) {
        throw new HttpNotFound(`Not found user ${userEmail}`);
    }

    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized('Your account has been suspended!')
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        user.status = STATUS.ACTIVATED;
        await user.save();
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: await User.findById(user._id, DETAILS.DETAIL),
        type: 'google',
        token: token
    });
}

exports.authenticateFacebookToken = async (req, res) => {
    const userToken = req.body.token
    const payload = await verifyFacebook(userToken);
    if (!payload) {
        throw new HttpInternalServerError('Error while verify facebook access token')
    }
    const facebookId = payload.id;

    const user = await User.findOne({ facebookId: facebookId }, DETAILS.STATUS);
    if (!user) {
        throw new HttpNotFound(`Not found user with this facebook`)
    }
    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized('Your account has been suspended!')
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        throw new HttpUnauthorized('Please login via email to activate  account first!');
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: await User.findById(user._id, DETAILS.DETAIL),
        type: 'facebook',
        token: token
    });
}

exports.linkFacebookAccount = async (req, res) => {
    const userToken = req.body.token
    if (req.user.facebookId) {
        throw new HttpUnauthorized('Your account has already linked facebook account!');
    }

    const payload = await verifyFacebook(userToken);
    if (!payload) {
        throw new HttpInternalServerError('Error while verify facebook access token')
    }

    const facebookId = payload.id;
    const fbUser = await User.findOne({ facebookId: facebookId });
    if (fbUser) {
        throw new HttpUnauthorized('This facebook account is linked with another account!');
    }
    const user = req.user
    user.facebookId = facebookId;

    await user.save();

    res.json({
        success: true,
        user,
        message: `Link to facebook ${payload.name} successfully!`
    })


}

exports.unlinkFacebookAccount = async (req, res) => {
    const user = req.user;
    if (!user.facebookId) {
        throw new HttpUnauthorized(`Your account hasn't already linked facebook!`)
    }
    user.facebookId = undefined;
    await user.save();

    res.send({
        success: true,
        user: await User.findById(user._id, DETAILS.DETAIL),
        message: `UnLink to facebook successfully!`
    });
}

