const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const schemaTitle = require("../constants/SchemaTitle");
const Privileges = mongoose.model(schemaTitle.PRIVILEGE);
const { UserValidate } = require("../constants/ValidationMessage");
const bcrypt = require('bcrypt');
const ValidatorError = mongoose.Error.ValidatorError;
const STATUS = require('../constants/AccountStatus');


const UserSchema = mongoose.Schema({
    code: {
        type: String,
        unique: [true, UserValidate.CODE],
        required: [true, UserValidate.CODE_UNIQUE]
    },
    password: {
        type: String,
        default: function () {
            return this.code
        }
    },
    idPrivilege: {
        type: String,
        ref: 'Privilege',
        required: [true, UserValidate.ID_PRIVILEGE],
        validate: async function (role) {
            await Privileges.findOne({ role: role })
                .then(privilege => {
                    if (!privilege) {
                        throw new ValidatorError({
                            message: UserValidate.NOT_FOUND_PRIVILEGE(role),
                            type: 'validate',
                            path: 'idPrivilege'
                        })
                    }
                });
        }
    },
    emailAddress: {
        type: String,
        required: [true, UserValidate.EMAIL],
        unique: [true, UserValidate.EMAIL_UNIQUE],
        lowercase: true,
        validate: function (value) {
            if (!validator.isEmail(value)) {
                throw new ValidatorError({ message: UserValidate.EMAIL_INVALID });
            }
            if (this.idPrivilege !== 'admin' && this.idPrivilege !== 'register') {
                if (!value.split('@').pop().includes('hcmute.edu.vn')) {
                    throw new ValidatorError({ message: UserValidate.EMAIL_NOT_IN_SYSTEM });
                }
            }
        }
    },
    firstName: {
        type: String,
        required: [true, UserValidate.FIRST_NAME]
    },
    lastName: {
        type: String,
        required: [true, UserValidate.LAST_NAME]
    },
    urlAvatar: {
        type: String,
        default: "https://www.shareicon.net/data/512x512/2017/01/06/868320_people_512x512.png"
    },
    facebookId: String,
    isNotify: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        required: [true, UserValidate.STATUS],
        enum: [STATUS.ACTIVATED, STATUS.SUSPENDED, STATUS.NOT_ACTIVATED]
    },
    resetToken: {
        token: {
            type: String,
            default: null,
        },
        date: {
            type: Date,
            default: null,
        },
    }
}, {
    timestamps: true,
});


const saltRounds = 10;
// hash the password before the user is saved
UserSchema.pre('save', function (next) {
    const user = this;
    // hash the password only if the password has been changed or user is new
    if (!user.isModified('password')) {
        if (!user.isNew) {
            return next();
        }
    }

    // generate the hash
    bcrypt.hash(user.password, saltRounds, function (err, hash) {
        if (err) return next(err);
        // change the password to the hashed version
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function (password) {
    const user = this;

    return bcrypt.compareSync(password, user.password);
};

UserSchema.methods.generateAuthToken = function (expiresIn = '24h') {
    // Generate an auth token for the user
    const user = this
    var superSecret = process.env.JWT_KEY;
    const token = jwt.sign({
        _id: user._id,
        code: user.code,
        idPrivilege: user.idPrivilege,
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
    }, superSecret, {
        expiresIn: expiresIn
    });
    return token
}


module.exports = mongoose.model(schemaTitle.USER, UserSchema);