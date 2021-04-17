const mongoose = require("mongoose");
const User = mongoose.model("User");
var ValidatorError = mongoose.Error.ValidatorError;

const user = new mongoose.Schema({
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: async function(value) {
            await User.findById(value)
                .then(user => {
                    if (!user) {
                        throw new ValidatorError({
                            message: 'Not found user',
                            type: 'validate',
                            path: 'Chat room'
                        })
                    }
                });
        }

    },
    config: {
        isMute: {
            type: Boolean,
            default: false
        }
    }
}, { _id: false });

const chatroom = new mongoose.Schema({
    users: {
        type: [user],
        required: true,
        validate: function(value) {
            if (value.length <= 0) {
                throw new ValidatorError({
                    message: `Can't create room without user`,
                    type: 'validate',
                    path: 'Chat room'
                })
            }
        }
    }
});

module.exports = mongoose.model("Chatroom", chatroom);