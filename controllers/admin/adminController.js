const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const User = mongoose.model(schemaTitle.USER);
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const moment = require('moment');

const { getCurrentSemester } = require('../../common/getCurrentSemester');

exports.getStatistic = async (req, res) => {
    const teachers = await User.countDocuments({
        idPrivilege: PRIVILEGES.TEACHER
    })
    const students = await User.countDocuments({
        idPrivilege: PRIVILEGES.STUDENT
    })
    const registers = await User.countDocuments({
        idPrivilege: PRIVILEGES.REGISTER
    })

    const total = teachers + students + registers;

    const newUsers = (await User.find(
        {
            idPrivilege: PRIVILEGES.REGISTER
        }, DETAILS.STATISTIC)
        .sort({ createdAt: -1 })
        .limit(5))
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
    const currentSemester = await getCurrentSemester();

    const publicSubjects = (await Course.find({
        idSemester: currentSemester._id,
        'config.role': 'public'
    })).length;
    const privateSubjects = (await Course.find({
        idSemester: currentSemester._id,
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