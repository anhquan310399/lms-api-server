const mongoose = require("mongoose");
const User = mongoose.model("User");
const { verifyGoogle, verifyFacebook } = require('../../handlers/verifySocialHandler');
const { HttpNotFound, HttpUnauthorized, HttpBadRequest, HttpInternalServerError } = require('../../utils/errors');

exports.update = async(req, res) => {
    const user = req.user;
    user.lastName = req.body.lastName || user.lastName;
    user.firstName = req.body.firstName || user.firstName;
    user.urlAvatar = req.body.urlAvatar || user.urlAvatar;
    user.isNotify = req.body.isNotify || user.isNotify;
    await user.save();

    res.json({
        user: {
            _id: user._id,
            code: user.code,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            urlAvatar: user.urlAvatar,
            facebookId: user.facebookId,
            idPrivilege: user.idPrivilege,
            isNotify: user.isNotify
        }
    })
};

exports.updatePassword = async(req, res) => {
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

exports.authenticate = async(req, res) => {
    const user = await User.findOne({ code: req.body.code, isDeleted: false });

    if (!user) {
        throw new HttpNotFound('Authentication failed. User not found');
    }

    var validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
        throw new HttpBadRequest('Authentication failed. Wrong password!');
    }
    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: {
            _id: user._id,
            code: user.code,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege,
            facebookId: user.facebookId,
            isNotify: user.isNotify
        },
        type: 'authenticate',
        token: token
    });
}

exports.getInfo = async(req, res) => {
    const user = req.user;
    const info = {
        _id: user._id,
        code: user.code,
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        urlAvatar: user.urlAvatar
    }
    res.json(info);
}

exports.authenticateGoogleToken = async(req, res) => {
    const userToken = req.body.token
    const payload = await verifyGoogle(userToken);
    const userEmail = payload.email;
    const user = await User.findOne({ emailAddress: userEmail, isDeleted: false },
        'code idPrivilege emailAddress firstName lastName urlAvatar facebookId isNotify');

    if (!user) {
        throw new HttpNotFound(`Not found user ${userEmail}`);
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: user,
        type: 'google',
        token: token
    });
}

exports.authenticateFacebookToken = async(req, res) => {
    const userToken = req.body.token

    const payload = await verifyFacebook(userToken);

    if (!payload) {
        throw new HttpInternalServerError('Error while verify facebook access token')
    }

    let facebookId = payload.id;
    const user = await User.findOne({ facebookId: facebookId, isDeleted: false },
        'code idPrivilege emailAddress firstName lastName urlAvatar facebookId isNotify');

    if (!user) {
        throw new HttpNotFound(`Not found user with this facebook`)
    }

    const token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: user,
        type: 'facebook',
        token: token
    });
}

exports.linkFacebookAccount = async(req, res) => {
    const userToken = req.body.token
    console.log(req.user);
    console.log(req.user.facebookId);
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
        user: {
            _id: user._id,
            code: user.code,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege,
            facebookId: user.facebookId,
            isNotify: user.isNotify
        },
        message: `Link to facebook ${payload.name} successfully!`
    })


}

exports.unlinkFacebookAccount = async(req, res) => {
    const user = req.user;
    if (!user.facebookId) {
        throw new HttpUnauthorized(`Your account hasn't already linked facebook!`)
    }
    user.facebookId = undefined;
    await user.save();

    res.send({
        success: true,
        user: {
            _id: user._id,
            code: user.code,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege,
            isNotify: user.isNotify
        },
        message: `UnLink to facebook successfully!`
    });
}