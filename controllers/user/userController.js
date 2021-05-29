const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const { verifyGoogle, verifyFacebook } = require('../../handlers/verifySocialHandler');
const { HttpNotFound, HttpUnauthorized, HttpBadRequest, HttpInternalServerError } = require('../../utils/errors');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');
const { MailOptions, MailTemplate } = require('../../utils/mailOptions');
const { sendMail } = require('../../services/SendMail');
const moment = require("moment");
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { UserResponseMessages } = ClientResponsesMessages

exports.register = async (req, res) => {
    const data = new User({
        code: req.body.username,
        password: req.body.password,
        idPrivilege: PRIVILEGES.REGISTER,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: STATUS.NOT_ACTIVATED
    });

    const user = await User.findOne({ $or: [{ emailAddress: data.emailAddress }, { code: data.code }] });

    if (user) {
        if (user.emailAddress === data.emailAddress) {
            throw new HttpBadRequest(UserResponseMessages.EMAIL_EXISTED)
        } else if (user.code === data.code) {
            throw new HttpBadRequest(UserResponseMessages.USERNAME_EXISTED)
        }
    }

    await data.save();

    res.json({
        success: true,
        message: UserResponseMessages.REQUEST_LOGIN_BY_EMAIL
    });
}

exports.requestResetPassword = async (req, res) => {
    const user = await User.findOne({ emailAddress: req.body.emailAddress });

    if (!user) {
        throw new HttpNotFound(UserResponseMessages.NOT_FOUND_WITH_EMAIL(req.body.emailAddress));
    }

    const date = user.resetToken.date;

    if (date) {
        const duration = moment.duration(moment(new Date()).diff(date));
        const minutes = duration.asMinutes();
        if (minutes <= 10) {
            throw new HttpUnauthorized(UserResponseMessages.REQUEST_RESET_PWD_LIMIT);
        }
    }
    const token = user.generateAuthToken('10m');

    const url = `${req.headers['origin']}/password/reset/${token}`;

    const mailOptions = new MailOptions({
        subject: MailTemplate.SUBJECT_RESET_PWD,
        to: user.emailAddress,
        html: MailTemplate.BODY_LINK_RESET_PWD(url)
    })

    const response = sendMail(mailOptions, true);

    if (response.status) {
        user.resetToken = { token, date: new Date() };
        await user.save();
        res.json({
            success: true,
            message: UserResponseMessages.REQUEST_RESET_PWD_SUCCESS
        })
    }
    else {
        throw new HttpInternalServerError(response.message);
    }

}

exports.resetPassword = async (req, res) => {
    const user = req.user;
    const token = req.header('Authorization').replace('Bearer ', '');
    if (user.resetToken?.token !== token) {
        throw new HttpUnauthorized(UserResponseMessages.REQUEST_RESET_PWD_EXPIRED);
    }
    user.password = req.body.password;
    user.resetToken = { ...user.resetToken, token: null };
    await user.save();
    res.json({
        success: true,
        message: UserResponseMessages.RESET_PWD_SUCCESS
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
        throw new HttpBadRequest(UserResponseMessages.UPDATE_PWD_INVALID);
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({
        success: true,
        message: UserResponseMessages.UPDATE_PWD_SUCCESS,
    });
};

exports.authenticate = async (req, res) => {
    const user = await User.findOne({ code: req.body.code });
    if (!user) {
        throw new HttpNotFound(UserResponseMessages.AUTHENTICATE_NOT_FOUND);
    }

    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_SUSPENDED)
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_NOT_ACTIVATED);
    }

    const validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
        throw new HttpBadRequest(UserResponseMessages.AUTHENTICATE_PWD_INVALID);
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: UserResponseMessages.AUTHENTICATE_SUCCESS,
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
    const user = await User.findOne({ emailAddress: userEmail });

    if (!user) {
        throw new HttpNotFound(UserResponseMessages.AUTHENTICATE_BY_EMAIL_NOT_FOUND(userEmail));
    }

    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_SUSPENDED)
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        user.status = STATUS.ACTIVATED;
        await user.save();
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: UserResponseMessages.AUTHENTICATE_SUCCESS,
        user: await User.findById(user._id, DETAILS.DETAIL),
        type: 'google',
        token: token
    });
}

exports.authenticateFacebookToken = async (req, res) => {
    const userToken = req.body.token
    const payload = await verifyFacebook(userToken);
    if (!payload) {
        throw new HttpInternalServerError(UserResponseMessages.AUTHENTICATE_BY_FACEBOOK_ERROR)
    }
    const facebookId = payload.id;

    const user = await User.findOne({ facebookId: facebookId }, DETAILS.STATUS);
    if (!user) {
        throw new HttpNotFound(UserResponseMessages.AUTHENTICATE_BY_FACEBOOK_NOT_FOUND)
    }
    if (user.status === STATUS.SUSPENDED) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_SUSPENDED)
    } else if (user.status === STATUS.NOT_ACTIVATED) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_NOT_ACTIVATED);
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: UserResponseMessages.AUTHENTICATE_SUCCESS,
        user: await User.findById(user._id, DETAILS.DETAIL),
        type: 'facebook',
        token: token
    });
}

exports.linkFacebookAccount = async (req, res) => {
    const userToken = req.body.token
    const user = req.user

    if (user.facebookId) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_LINKED_FACEBOOK);
    }

    const payload = await verifyFacebook(userToken);
    if (!payload) {
        throw new HttpInternalServerError(UserResponseMessages.AUTHENTICATE_BY_FACEBOOK_ERROR)
    }

    const facebookId = payload.id;
    const fbUser = await User.findOne({ facebookId: facebookId });
    if (fbUser) {
        throw new HttpUnauthorized(UserResponseMessages.FACEBOOK_LINK_ANOTHER_ACCOUNT);
    }

    user.facebookId = facebookId;

    await user.save();

    res.json({
        success: true,
        user: await User.findById(user._id, DETAILS.DETAIL),
        message: UserResponseMessages.ACCOUNT_LINK_FACEBOOK_SUCCESS(payload.name)
    })


}

exports.unlinkFacebookAccount = async (req, res) => {
    const user = req.user;
    if (!user.facebookId) {
        throw new HttpUnauthorized(UserResponseMessages.ACCOUNT_NOT_LINKED_FACEBOOK)
    }
    user.facebookId = undefined;
    await user.save();

    res.send({
        success: true,
        user: await User.findById(user._id, DETAILS.DETAIL),
        message: UserResponseMessages.ACCOUNT_UNLINK_FACEBOOK_SUCCESS
    });
}

