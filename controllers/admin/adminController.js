const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const User = mongoose.model(schemaTitle.USER);
const Faculty = mongoose.model(schemaTitle.FACULTY);
const Classes = mongoose.model(schemaTitle.CLASS);
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');
const moment = require('moment');

const _ = require('lodash');

const { getCurrentSemester } = require('../../common/getCurrentSemester');

const {
    getListAssignmentAndExam,
    getUserById,
} = require('../../services/DataHelpers');

exports.getDashBoardStatistic = async (req, res) => {
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

exports.getLearningResultOfSemester = async (req, res) => {

    const semester = await getCurrentSemester();

    const learningResults = await getLearningResult(semester);

    const data = await Promise.all(learningResults.map(async (result) => {
        return { ...result, gpa: Number.parseFloat(result.gpa).toFixed(0) }
    }))

    const statistic = _.chain(data)
        .groupBy('gpa')
        .map((items, key) => {
            return { key, count: items.length }
        })
        .value();

    res.json({
        data: learningResults, statistic
    })
}

const getCourseResultOfStudent = async (course, idStudent) => {
    const today = new Date();
    const assignmentOrExam = await getListAssignmentAndExam(course, today);

    let totalRatio = 0;

    const grade = await Promise.all(assignmentOrExam.map(async (value) => {
        const transcript = course.transcript.find(ratio => ratio.idField.equals(value._id));

        totalRatio += transcript.ratio;

        let submission = value.submissions.find(value => value.idStudent.equals(idStudent));

        if (submission) {
            return submission.grade * transcript.ratio;
        } else {
            return 0;
        }

    }));

    const total = grade.reduce((a, b) => a + b);

    if (totalRatio) {
        return (total / totalRatio).toFixed(2);
    } else {
        return 0;
    }
}


const getLearningResult = async (semester) => {
    const faculties = await Faculty.find({}, 'name');

    const learningResults = await Promise.all(faculties.map(async (faculty) => {

        const curriculums = await Curriculum.find({
            idFaculty: faculty._id
        }, 'code');

        const data = await Promise.all(curriculums.map(async ({ _id: idCurriculum, code: codeCurriculum }) => {

            const classes = await Classes.find({ idCurriculum });

            const students = await Promise.all(classes.map(async (cls) => {

                const result = await Promise.all(cls.students.map(async (idStudent) => {

                    const courses = await Course.find({
                        isDeleted: false,
                        'studentIds': idStudent,
                        'config.role': 'private',
                        idSemester: semester._id
                    });

                    const scores = await Promise.all(courses.map(async (course) => {
                        return getCourseResultOfStudent(course, idStudent);
                    }));

                    const gpa = (scores.reduce((result, score) => { return result + score / scores.length }, 0)).toFixed(2);

                    const student = await User.findById(idStudent, 'code firstName lastName');

                    return {
                        code: student.code,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        faculty: faculty.name,
                        curriculum: codeCurriculum,
                        class: cls.name,
                        gpa
                    }
                }));
                return [].concat.apply([], result);
            }));

            return [].concat.apply([], students);
        }))

        return [].concat.apply([], data);
    }));

    const data = [].concat.apply([], learningResults);

    const sorted = _.sortBy(data, ["faculty", "class", "gpa", "lastName"]);

    return sorted;
}
