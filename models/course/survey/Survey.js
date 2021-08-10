const mongoose = require("mongoose");
const questionSchema = require('./Question');
const responseSchema = require('./Response');
const { SurveyValidate } = require("../../../constants/ValidationMessage");

const survey = new mongoose.Schema({
    name: {
        type: String,
        required: [true, SurveyValidate.NAME]
    },
    description: String,
    responses: {
        type: [responseSchema],
        default: []
    },
    setting: {
        startTime: {
            type: Date,
            required: [true, SurveyValidate.SETTING_START_TIME]
        },
        expireTime: {
            type: Date,
            required: [true, SurveyValidate.SETTING_EXPIRE_TIME],
            validate: [function (value) {
                return value >= this.setting.startTime
            }, SurveyValidate.SETTING_EXPIRE_TIME_VALID]
        },
    },
    questionnaire: {
        type: [questionSchema],
        required: [true, SurveyValidate.QUESTIONNAIRE]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = survey;