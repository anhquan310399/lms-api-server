const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const User = mongoose.model("User");
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const moment = require('moment');

const { getCurrentCourse } = require('../../common/getCurrentCourse');

exports.getStatistic = async (req, res) => {
    const teachers = (await User.find({
        idPrivilege: PRIVILEGES.TEACHER
    })).length
    const students = (await User.find({
        idPrivilege: PRIVILEGES.STUDENT
    })).length
    const registers = (await User.find({
        idPrivilege: PRIVILEGES.REGISTER
    })).length

    const total = teachers + students + registers;

    const newUsers =
        (await User.find(
            {
                idPrivilege: PRIVILEGES.REGISTER
            }, DETAILS.STATISTIC)
            .sort({ createdAt: -1 })
            .limit(6))
            .map(user => {
                var createdAt = moment(user.createdAt).format('DD MMMM HH:mm');
                return {
                    _id: user._id,
                    fullName: user.firstName + " " + user.lastName,
                    emailAddress: user.emailAddress,
                    urlAvatar: user.urlAvatar,
                    status: user.status,
                    createdAt
                };
            });
    const currentCourse = await getCurrentCourse();
    const publicSubjects = (await Subject.find({
        idCourse: currentCourse._id,
        'config.role': 'public'
    })).length;
    const privateSubjects = (await Subject.find({
        idCourse: currentCourse._id,
        'config.role': 'private'
    })).length;

    res.json({
        newUsers,
        teachers: {
            percent: (teachers * 100 / total).toFixed(0),
            amount: teachers
        },
        students: {
            percent: (students * 100 / total).toFixed(0),
            amount: students
        },
        registers: {
            percent: (registers * 100 / total).toFixed(0),
            amount: registers
        },
        publicSubjects,
        privateSubjects
    });
}