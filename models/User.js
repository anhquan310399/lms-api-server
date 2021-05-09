const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const Privileges = mongoose.model('Privilege');
const bcrypt = require('bcrypt');
const ValidatorError = mongoose.Error.ValidatorError;
const STATUS = require('../constants/AccountStatus');

const UserSchema = mongoose.Schema({
    code: {
        type: String,
        unique: [true, 'Code is existed!'],
        required: [true, 'Code is required']
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
        required: [true, 'idPrivilege is required'],
        validate: async function (value) {
            await Privileges.findOne({ role: value })
                .then(privilege => {
                    if (!privilege) {
                        throw new ValidatorError({
                            message: 'Not found privilege',
                            type: 'validate',
                            path: 'idPrivilege'
                        })
                    }
                });
        }
    },
    emailAddress: {
        type: String,
        required: [true, 'Email address is required'],
        unique: [true, `Email address is existed`],
        lowercase: true,
        validate: function (value) {
            if (this.idPrivilege !== 'admin' && this.idPrivilege !== 'register') {
                if (!validator.isEmail(value)) {
                    throw new ValidatorError({ message: 'Invalid Email address' });
                } else if (!value.split('@').pop().includes('hcmute.edu.vn')) {
                    throw new ValidatorError({ message: 'Email address not in HCMUTE' });
                }
            }
        }
    },
    firstName: {
        type: String,
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required']
    },
    urlAvatar: {
        type: String,
        default: "http://simpleicon.com/wp-content/uploads/user1.png"
    },
    facebookId: String,
    isNotify: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        required: [true, 'Status of user account is required'],
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
    var user = this;
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
    var user = this;

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


module.exports = mongoose.model("User", UserSchema);