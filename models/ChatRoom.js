const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
var ValidatorError = mongoose.Error.ValidatorError;
const { ChatroomValidate } = require("../constants/ValidationMessage");

const user = new mongoose.Schema({
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true,
        validate: async function (id) {
            await User.findById(id)
                .then(user => {
                    if (!user) {
                        throw new ValidatorError({
                            message: ChatroomValidate.NOT_FOUND_USER(id),
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
        validate: function (value) {
            if (value.length <= 0) {
                throw new ValidatorError({
                    message: ChatroomValidate.CREATE_WITHOUT_USER,
                    type: 'validate',
                    path: 'Chat room'
                })
            }
        }
    }
});

module.exports = mongoose.model(schemaTitle.CHATROOM, chatroom);