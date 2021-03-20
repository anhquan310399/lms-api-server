
const mongoose = require("mongoose");
const User = mongoose.model("User");
const { verifyGoogle, verifyFacebook } = require('../handlers/verifySocialHandler');

exports.create = async (req, res) => {
    const user = new User({
        code: req.body.code,
        idPrivilege: req.body.idPrivilege,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        surName: req.body.surName
    });
    const data = await user.save();

    res.json(data);
};

exports.findAll = async (req, res) => {
    const users = await User.find();
    res.json(users);
};

exports.findAllStudents = async (req, res) => {
    const students = await User.find({ idPrivilege: 'student' },
        'code emailAddress idPrivilege firstName surName urlAvatar isDeleted');
    res.json(students);
};

exports.findAllTeachers = async (req, res) => {
    const teachers = await User.find({ idPrivilege: 'teacher' },
        'code emailAddress idPrivilege firstName surName urlAvatar isDeleted');
    res.json(teachers);
};

exports.findUser = async (req, res) => {
    const user = await User.findOne({ code: req.params.code },
        'code emailAddress firstName surName urlAvatar');
    res.json(user);
};

exports.update = async (req, res) => {
    let user = req.user;
    user.surName = req.body.surName || user.surName;
    user.firstName = req.body.firstName || user.firstName;
    user.urlAvatar = req.body.urlAvatar || user.urlAvatar;

    await user.save();

    res.json({
        user: {
            _id: data._id,
            code: data.code,
            emailAddress: data.emailAddress,
            firstName: data.firstName,
            surName: data.surName,
            urlAvatar: data.urlAvatar,
            facebookId: data.facebookId,
            idPrivilege: data.idPrivilege
        }
    })
};

exports.updatePassword = async (req, res) => {
    let user = req.user;
    let isAuth = user.comparePassword(req.body.password);
    if (!isAuth) {
        return res.status(400).json({
            success: false,
            message: 'Password is not valid',
        });
    }
    user.password = req.body.newPassword;
    await user.save();

    res.json({
        success: true,
        message: `Update password successfully`,
    });
};

exports.hideOrUnhide = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Not found user",
        });
    }

    user.isDeleted = !user.isDeleted;

    await user.save();

    let message;
    if (user.isDeleted) {
        message = `Lock user with code: ${user.code} successfully!`;
    } else {
        message = `Unlock user with code: ${user.code} successfully!`;
    }
    res.send({
        success: true,
        message: message,
    });
};

exports.authenticate = async (req, res) => {
    const user = await User.findOne({ code: req.body.code, isDeleted: false });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Authentication failed. User not found'
        });
    }

    var validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
        return res.status(400).send({
            success: false,
            message: 'Authentication failed. Wrong password!'
        });
    }

    let token = user.generateAuthToken();
    res.json({
        success: true,
        message: 'Login successfully!',
        user: {
            _id: user._id,
            code: user.code,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            surName: user.surName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege,
            facebookId: user.facebookId
        },
        type: 'authenticate',
        token: token
    });
}

exports.getInfo = async (req, res) => {
    var user = req.user;
    var info = {
        _id: user._id,
        code: user.code,
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        surName: user.surName,
        urlAvatar: user.urlAvatar
    }
    res.json(info);
}

exports.authenticateGoogleToken = async (req, res) => {
    const userToken = req.body.token
    const payload = await verifyGoogle(userToken);

    var userEmail = payload.email;

    const user = await User.findOne({ emailAddress: userEmail, isDeleted: false },
        'code idPrivilege emailAddress firstName surName urlAvatar facebookId');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `Not found user ${userEmail}`
        });

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

exports.authenticateFacebookToken = async (req, res) => {
    const userToken = req.body.token

    const payload = await verifyFacebook(userToken);

    if (!payload) {
        res.status(500).json({
            success: false,
            message: 'Error while verify facebook access token'
        })
    }

    let facebookId = payload.id;
    const user = await User.findOne({ facebookId: facebookId, isDeleted: false },
        'code idPrivilege emailAddress firstName surName urlAvatar facebookId');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: `Not found user with this facebook`
        })
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

exports.linkFacebookAccount = async (req, res) => {
    const userToken = req.body.token
    console.log(req.user);
    console.log(req.user.facebookId);
    if (req.user.facebookId) {
        return res.status(409).json({
            success: false,
            message: 'Your account has already linked facebook account!'
        })
    }

    const payload = await verifyFacebook(userToken);

    if (!payload) {
        return res.status(500).json({
            success: false,
            message: 'Error while verify facebook access token'
        })
    }

    const facebookId = payload.id;

    const fbUser = await User.findOne({ facebookId: facebookId });
    if (fbUser) {
        return res.status(409).send({
            success: false,
            message: 'This facebook account is linked with another account!'
        })
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
            surName: user.surName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege,
            facebookId: user.facebookId
        },
        message: `Link to facebook ${payload.name} successfully!`
    })


}

exports.unlinkFacebookAccount = async (req, res) => {
    const user = req.user;
    if (!user.facebookId) {
        res.status(409).json({
            success: false,
            message: `Your account hasn't already linked facebook!`
        })
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
            surName: user.surName,
            urlAvatar: user.urlAvatar,
            idPrivilege: user.idPrivilege
        },
        message: `UnLink to facebook successfully!`
    });
}