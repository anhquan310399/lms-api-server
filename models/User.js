const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const Privileges = mongoose.model('Privilege');
const bcrypt = require('bcrypt');
var ValidatorError = mongoose.Error.ValidatorError;

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
            if (this.idPrivilege !== 'admin') {
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
    surName: {
        type: String,
        required: [true, 'Surname is required']
    },
    urlAvatar: {
        type: String,
        default: "http://simpleicon.com/wp-content/uploads/user1.png"
    },
    facebookId: String,
    isDeleted: {
        type: Boolean,
        default: false
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

UserSchema.methods.generateAuthToken = function () {
    // Generate an auth token for the user
    const user = this
    var superSecret = process.env.JWT_KEY;
    const token = jwt.sign({
        _id: user._id,
        code: user.code,
        idPrivilege: user.privilege,
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        surName: user.surName,
    }, superSecret, {
        expiresIn: '24h'
    });
    return token
}

module.exports = mongoose.model("User", UserSchema);