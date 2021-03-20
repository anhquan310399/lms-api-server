const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const User = mongoose.model("User");
const _ = require('lodash');
const isToday = require('../common/isToday.js');
const { HttpNotFound, HttpBadRequest } = require('../utils/errors');
const examStatusCodes = require('../constants/examStatusCodes');

exports.create = async (req, res) => {
    const data = new Subject({
        name: req.body.name,
        idLecture: req.body.idLecture,
        studentIds: req.body.studentIds,
        timelines: req.body.timelines,
        quizBank: req.body.quizBank,
        surveyBank: req.body.surveyBank
    });

    const subject = await data.save();
    const teacher = await User.findOne({ code: subject.idLecture },
        'code firstName surName urlAvatar');
    res.json({
        success: true,
        subject: {
            _id: subject._id,
            name: subject.name,
            lecture: teacher,
            studentCount: subject.studentIds.length,
            isDeleted: subject.isDeleted
        },
        message: `Create new subject ${subject.name} successfully!`
    });
};

exports.findAll = async (req, res) => {
    var idPrivilege = req.idPrivilege;
    const allSubject = [];
    if (idPrivilege === 'teacher') {
        allSubject = await Subject.find({ idLecture: req.code, isDeleted: false }, "name");
    } else if (idPrivilege === 'student') {
        const subjects = await Subject.find({ 'studentIds': req.code, isDeleted: false })
        allSubject = await Promise.all(subjects.map(async (value) => {
            var teacher = await User.findOne({ code: value.idLecture }, 'code firstName surName urlAvatar')
                .then(value => {
                    return value
                });
            return { _id: value._id, name: value.name, lecture: teacher };
        }));
    } else if (idPrivilege === 'admin') {
        const subjects = await Subject.find({});
        allSubject = await Promise.all(subjects.map(async (value) => {
            var teacher = await User.findOne({ code: value.idLecture }, 'code firstName surName urlAvatar')
                .then(value => {
                    return value
                });
            return { _id: value._id, name: value.name, lecture: teacher };
        }));
    }

    res.json({
        success: true,
        allSubject: allSubject
    });
};

exports.find = async (req, res) => {
    let subject = req.subject;
    let timelines = req.subject.timelines;

    if (req.user.idPrivilege === 'student') {
        timelines = await timelines.filter((value) => {
            return !value.isDeleted;
        });
        timelines = await filterTimelines(timelines, true);
    } else {
        timelines = await filterTimelines(timelines, false);
    }

    const teacher = await User.findOne({ code: subject.idLecture },
        'code firstName surName urlAvatar');

    let result = {
        _id: subject._id,
        name: subject.name,
        lecture: teacher,
        timelines: timelines
    };
    res.json({
        success: true,
        subject: result
    });
};

exports.findByAdmin = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    var teacher = await User.findOne({ code: subject.idLecture },
        'code firstName surName urlAvatar');
    res.json({
        success: true,
        subject: {
            _id: subject._id,
            name: subject.name,
            lecture: teacher,
            studentCount: subject.studentIds.length,
            isDeleted: subject.isDeleted
        }
    });
}

exports.update = async (req, res) => {
    let subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }

    subject.name = req.body.name || subject.name;
    subject.idLecture = req.body.idLecture || subject.idLecture;
    subject.studentIds = req.body.studentIds || subject.studentIds;
    subject.timelines = req.body.timelines || subject.timelines;
    subject.surveyBank = req.body.surveyBank || subject.surveyBank;
    subject.quizBank = req.body.quizBank || subject.quizBank;

    await subject.save();

    res.json({
        success: true,
        message: "Update Subject Successfully"
    });
};

exports.importSubject = async (req, res) => {
    let subject = req.subject;

    if (req.body.timelines) {
        if (subject.timelines.length === 0) {
            subject.timelines = req.body.timelines;
        } else {
            throw new HttpBadRequest({ message: 'Đã có dữ liệu các tuần không thể import!' });
        }
    }
    if (req.body.studentIds) {
        subject.studentIds = subject.studentIds.concat(req.body.studentIds);
        subject.studentIds = subject.studentIds.filter((a, b) => subject.studentIds.indexOf(a) === b)
    }
    if (req.body.surveyBank) {
        subject.surveyBank = subject.surveyBank.concat(req.body.surveyBank);
    }
    if (req.body.quizBank) {
        subject.quizBank = subject.quizBank.concat(req.body.quizBank);
    }

    await subject.save();

    const timelines = await filterTimelines(subject.timelines, false);

    const surveyBank = await Promise.all(subject.surveyBank.map(value => {
        return {
            _id: value._id,
            name: value.name,
            questions: value.questions.length
        }
    }));
    const quizBank = await Promise.all(subject.quizBank.map(value => {
        return {
            _id: value._id,
            name: value.name,
            questions: value.questions.length
        }
    }));
    res.json({
        success: true,
        message: `Import data to subject ${subject.name} successfully!`,
        timelines: timelines,
        surveyBank: surveyBank,
        quizBank: quizBank
    });
};

exports.delete = async (req, res) => {
    const data = await Subject.findByIdAndDelete(req.params.idSubject)
    if (!data) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    res.json({
        success: true,
        message: `Delete Subject ${data.name} Successfully`
    });

};

exports.hideOrUnhide = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject)
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    subject.isDeleted = !subject.isDeleted;
    await subject.save()
    let message;
    if (subject.isDeleted) {
        message = `Lock subject: ${subject.name} successfully!`;
    } else {
        message = `Unlock subject : ${subject.name} successfully!`;
    }
    res.json({
        success: true,
        message: message,
    });
};

exports.addListStudents = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    var list = subject.studentIds.concat(req.body).sort();
    list = list.filter((a, b) => list.indexOf(a) === b);
    subject.studentIds = list;
    await subject.save();
    res.json({
        success: true,
        message: "Add Student Successfully!"
    });

};

exports.addStudent = async (req, res) => {
    let subject = req.subject;

    let idStudent = subject.studentIds.find(value => { return value === req.body.idStudent });
    if (idStudent) {
        throw new HttpBadRequest({ message: 'This student has already in subject' });
    }

    const user = await User.findOne({ code: req.body.idStudent, idPrivilege: 'student' },
        'code firstName surName urlAvatar');
    if (!user) {
        throw new HttpNotFound({ message: `Not found student with id: ${req.body.idStudent}` });
    }
    subject.studentIds.push(req.body.idStudent);
    await subject.save()

    const info = await Promise.all(subject.studentIds.map(async function (value) {
        var student = await User.findOne({ code: value }, 'code emailAddress firstName surName urlAvatar');
        return student;
    }));

    res.json({
        success: true,
        message: `Add Student with code ${req.body.idStudent} Successfully!`,
        students: info
    });
};

exports.removeStudent = async (req, res) => {
    // Validate request
    let subject = req.subject;

    let index = subject.studentIds.indexOf(req.body.idStudent);
    if (index === -1) {
        throw new HttpNotFound({ message: `Not found this student with id: ${req.body.idStudent}` });
    }
    subject.studentIds.splice(index, 1);
    await subject.save();

    const info = await Promise.all(subject.studentIds.map(async function (value) {
        var student = await User.findOne({ code: value },
            'code emailAddress firstName surName urlAvatar');
        return student;
    }));
    // res.send(data);
    res.json({
        success: true,
        message: `Remove Student with code ${req.body.idStudent} Successfully!`,
        students: info
    });
}

exports.adjustOrderOfTimeline = async (req, res) => {
    const adjust = req.body;
    const subject = req.subject;
    await adjust.forEach(element => {
        var timeline = subject.timelines.find(x => x._id == element._id);
        timeline.index = element.index;
    });
    await subject.save();

    const timelines = await filterTimelines(subject.timelines, false);
    res.json({
        success: true,
        message: 'Adjust index of timeline successfully!',
        timelines: timelines
    })
}

exports.getOrderOfTimeLine = async (req, res) => {
    const data = req.subject;
    let result = {
        _id: data._id,
        name: data.name,
        timelines: _.sortBy(data.timelines.map((value) => {
            return { _id: value._id, name: value.name, description: value.description, index: value.index, isDeleted: value.isDeleted };
        }), ['index']),
    };
    res.json({
        success: true,
        orderTimeline: result
    });
}

exports.getListStudent = async (req, res) => {
    const subject = req.subject;

    var info = await Promise.all(subject.studentIds.map(async function (value) {
        var student = await User.findOne({ code: value },
            'code emailAddress firstName surName urlAvatar');

        return student;
    }));
    res.json({
        success: true,
        students: info
    });
}


exports.getSubjectTranscript = async (req, res) => {
    let subject = req.subject;
    let today = new Date();
    let fields = await getListAssignmentAndExam(subject, today);

    if (req.user.idPrivilege === 'student') {
        let transcript = await Promise.all(fields.map(async (field) => {
            let submission = await field.submissions.find(value => value.idStudent == req.user._id);
            let grade = 0;
            let status;
            if (field.type === 'exam') {
                if (submission || (!submission && !field.isRemain)) {
                    grade = submission.grade || 0;
                    status = examStatusCodes.COMPLETED;
                } else {
                    grade = null;
                    status = examStatusCodes.NOT_SUBMIT;
                }
            } else {
                if (submission) {
                    if (submission.isGrade) {
                        grade = submission.grade;
                        status = examStatusCodes.COMPLETED;
                    } else {
                        grade = null;
                        status = examStatusCodes.NOT_GRADE;
                    }
                } else if (field.isRemain) {
                    grade = null;
                    status = examStatusCodes.NOT_SUBMIT;
                } else {
                    grade = 0;
                    status = examStatusCodes.COMPLETED
                }
            }
            return {
                name: field.name,
                grade: grade,
                status: status
            }
        }))
        return res.send(transcript);
    } else {
        let transcript = await Promise.all(fields.map(async (field) => {
            let submissions = await Promise.all(subject.studentIds.map(
                async (value) => {
                    let student = await User.findOne({ code: value }, 'code firstName surName urlAvatar');

                    let submission = field.submissions.find(value => value.idStudent == student._id);
                    let isRemain = field.isRemain;

                    if (submission) {
                        if (field.type === 'exam') {
                            return {
                                student: student,
                                grade: submission.grade,
                                status: examStatusCodes.COMPLETED
                            }
                        } else if (field.type === 'assignment') {
                            if (submission.isGrade) {
                                return {
                                    student: student,
                                    grade: submission.grade,
                                    status: examStatusCodes.COMPLETED
                                }
                            } else {
                                return {
                                    student: student,
                                    grade: null,
                                    status: examStatusCodes.NOT_GRADE
                                }
                            }
                        }
                    } else if (isRemain) {
                        return {
                            student: student,
                            grade: null,
                            status: examStatusCodes.NOT_SUBMIT
                        }
                    } else {
                        return {
                            student: student,
                            grade: 0,
                            status: examStatusCodes.COMPLETED
                        }
                    }
                }))
            return {
                _id: field._id,
                name: field.name,
                submissions: submissions
            }
        }));

        return res.json(transcript);
    }
}

exports.getSubjectTranscriptTotal = async (req, res) => {
    let subject = req.subject;
    let today = new Date();
    let assignmentOrExam = await getListAssignmentAndExam(subject, today);

    let fields = { 'c0': 'MSSV', 'c1': 'Họ', 'c2': 'Tên' }
    let ratios = { 'c0': null, 'c1': null, 'c2': null }
    let count = 3;
    let totalRatio = 0;
    assignmentOrExam.forEach(value => {
        let key = 'c' + count++;
        fields[key] = value.name;
        let transcript = subject.transcript.find(ratio => ratio.idField == value._id);
        ratios[key] = {
            _id: transcript._id,
            ratio: transcript.ratio
        };
        totalRatio += transcript.ratio;
    });

    let data = await Promise.all(subject.studentIds.map(
        async (value) => {
            let student = await User.findOne({ code: value }, 'code firstName surName urlAvatar')
                .then(value => { return value });
            let data = {
                'c0': student.code,
                'c1': student.surName,
                'c2': student.firstName
            };
            let count = 3;
            let grade = await Promise.all(assignmentOrExam.map(async (value) => {
                let submission = value.submissions.find(value => value.idStudent == student._id);
                if (submission) {
                    return submission.grade;
                } else if (value.isRemain) {
                    return null;
                } else {
                    return 0;
                }

            }));
            let total = 0;
            grade.forEach(value => {
                let key = 'c' + count++;
                data[key] = value;
                total += (data[key] * ratios[key].ratio);
            });
            let key = 'c' + count;
            data[key] = (total / totalRatio).toFixed(2);
            ratios[key] = null;
            fields[key] = 'Trung bình';
            return data;
        }
    ));

    return res.send({
        fields: fields,
        ratio: ratios,
        data: data
    });

}

exports.updateRatioTranscript = async (req, res) => {
    let subject = req.subject;
    let adjust = req.body;
    await adjust.forEach(async (value) => {
        let transcript = await subject.transcript.find(ratio => ratio._id == value._id);
        if (transcript) {
            transcript.ratio = value.ratio;
        }
    });

    await subject.save();

    return this.getSubjectTranscriptTotal(req, res);
}

exports.exportSubject = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject)
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    const timelines = await getTimelineExport(subject.timelines);

    const quizBank = await getQuizBankExport(subject.quizBank);

    const surveyBank = await getSurveyBankExport(subject.surveyBank);

    subject = {
        timelines: timelines,
        quizBank: quizBank,
        surveyBank: surveyBank
    }

    res.attachment(`${subject.name}.json`)
    res.type('json')
    res.send(subject)
}

exports.exportSubjectWithCondition = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound({ message: "Not found subject" });
    }
    let data = {};

    if (req.body.isTimelines) {
        let timelines = await getTimelineExport(subject.timelines)
        let surveyBank = await getSurveyBankExport(subject.surveyBank)
        let quizBank = await getQuizBankExport(subject.quizBank)
        data = {
            timelines: timelines,
            surveyBank: surveyBank,
            quizBank: quizBank
        }
    } else {
        if (req.body.isQuizBank) {
            let quizBank = await getQuizBankExport(subject.quizBank);
            quizBank = quizBank.map(value => { return { name: value.name, questions: value.questions } });
            data['quizBank'] = quizBank

        }
        if (req.body.isSurveyBank) {
            let surveyBank = await getSurveyBankExport(subject.surveyBank);
            surveyBank = surveyBank.map(value => { return { name: value.name, questions: value.questions } });
            data['surveyBank'] = surveyBank;
        }
    }

    res.attachment(`${subject.name}.json`);
    res.type('json');
    res.send(data);
}

exports.getDeadline = async (req, res) => {
    const listSubject = await Subject.find({ 'studentIds': req.code, isDeleted: false });
    let deadline = [];
    const today = new Date();
    listSubject.forEach(subject => {
        deadline = deadline.concat(getDeadlineOfSubject(subject));
    });

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

exports.getDeadlineBySubject = async (req, res) => {
    const today = new Date();
    let subject = req.subject;

    let deadline = getDeadlineOfSubject(subject);

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

//Function
const getListAssignmentAndExam = async (subject, today) => {
    let assignmentOrExam = await subject.timelines.reduce(
        async (preField, currentTimeline) => {
            if (currentTimeline.isDeleted) {
                let result = await preField;
                return result;
            } else {
                let exams = await Promise.all(currentTimeline.exams.map(async (exam) => {
                    if (exam.isDeleted) {
                        return null;
                    }
                    let exists = [];
                    let submissions = await exam.submissions.reduce(function (prePromise, submission) {
                        let exist = exists.find(value => value.idStudent == submission.idStudent);
                        if (exist) {
                            let existSubmission = prePromise[exist.index];
                            prePromise[exist.index].grade = existSubmission.grade >= submission.grade ? existSubmission.grade : submission.grade;
                            return prePromise;
                        } else {
                            exists = exists.concat({
                                idStudent: submission.idStudent,
                                grade: submission.grade,
                                index: prePromise.length
                            })
                            return prePromise.concat({
                                // _id: submission._id,
                                idStudent: submission.idStudent,
                                grade: submission.grade
                            })
                        }
                    }, []);
                    let isRemain = today <= exam.expireTime;
                    return {
                        // idSubject: subject._id,
                        // idTimeline: currentTimeline._id,
                        _id: exam._id,
                        name: exam.name,
                        isRemain: isRemain,
                        submissions: submissions,
                        type: 'exam',
                    }
                }));
                let assignments = await Promise.all(currentTimeline.assignments.map(async (assignment) => {
                    if (assignment.isDeleted) {
                        return null;
                    }

                    let submissions = await Promise.all(assignment.submissions.map(async (submission) => {
                        return {
                            // _id: submission._id,
                            idStudent: submission.idStudent,
                            grade: submission.feedBack ? submission.feedBack.grade : 0,
                            isGrade: submission.feedBack ? true : false,
                        }
                    }));

                    let isRemain = today <= assignment.setting.expireTime;

                    return {
                        // idSubject: subject._id,
                        // idTimeline: currentTimeline._id,
                        _id: assignment._id,
                        name: assignment.name,
                        isRemain: isRemain,
                        submissions: submissions,
                        type: 'assignment'
                    }
                }));
                let currentFields = exams.concat(assignments);
                let result = await preField;
                return result.concat(currentFields);
            }
        }, []);
    assignmentOrExam = await (assignmentOrExam.filter((value) => {
        return (value !== null);
    }));

    return assignmentOrExam;
}

const getTimelineExport = async (timelines) => {
    const result = await Promise.all(timelines.map(async (timeline) => {
        let surveys = await Promise.all(timeline.surveys.map(async (survey) => {
            return {
                name: survey.name,
                description: survey.description,
                code: survey.code,
                expireTime: survey.expireTime
            }
        }));
        let forums = timeline.forums.map(forum => {
            return {
                name: forum.name,
                description: forum.description
            }
        });
        let exams = timeline.exams.map(exam => {
            return {
                name: exam.name,
                content: exam.content,
                startTime: exam.startTime,
                expireTime: exam.expireTime,
                setting: exam.setting
            }
        });
        let information = timeline.information.map(info => {
            return {
                name: info.name,
                content: info.content
            }
        });
        let assignments = timeline.assignments.map(assignment => {
            return {
                name: assignment.name,
                content: assignment.content,
                attachments: assignment.attachments,
                setting: assignment.setting
            }
        });
        return {
            name: timeline.name,
            description: timeline.description,
            surveys: surveys,
            forums: forums,
            exams: exams,
            information: information,
            assignments: assignments,
            files: timeline.files,
            index: timeline.index
        }
    }));
    return _.sortBy(result, ['index']);
}

const getSurveyBankExport = async (surveyBank) => {
    return await Promise.all(surveyBank.map(async (questionnaire) => {
        const questions = questionnaire.questions.map(question => {
            if (question.typeQuestion === 'choice' || question.typeQuestion === 'multiple') {
                const answers = question.answer.map(answer => {
                    return answer.content;
                });
                return {
                    question: question.question,
                    answer: answers,
                    typeQuestion: question.typeQuestion
                }
            } else {
                return {
                    question: question.question,
                    typeQuestion: question.typeQuestion
                }
            }
        });
        return {
            _id: questionnaire._id,
            name: questionnaire.name,
            questions: questions
        }
    }))
}

const getQuizBankExport = async (quizBank) => {
    return await Promise.all(quizBank.map(async (questionnaire) => {
        const questions = questionnaire.questions.map((question) => {
            const answers = question.answers.map(option => {
                return {
                    answer: option.answer,
                    isCorrect: option.isCorrect
                }
            });
            return {
                question: question.question,
                answers: answers,
                typeQuestion: question.typeQuestion,
                explain: question.explain
            }
        });
        return {
            _id: questionnaire._id,
            name: questionnaire.name,
            questions: questions
        }
    }))
}

const filterTimelines = async (timelines, isStudent) => {
    const res = _.sortBy(await Promise.all(timelines.map(async (value) => {
        let forums = value.forums.reduce((preForums, currentForum) => {
            if (isStudent && currentForum.isDeleted) {
                return preForums;
            }
            let forum = {
                _id: currentForum.id,
                name: currentForum.name,
                description: currentForum.description,
                time: currentForum.createdAt,
                isNew: isToday(currentForum.updatedAt),
                isDeleted: isStudent ? null : currentForum.isDeleted
            }
            return (preForums.concat(forum));
        }, []);
        let exams = value.exams.reduce((preExams, currentExam) => {
            if (isStudent && currentExam.isDeleted) {
                return preExams;
            }

            let exam = {
                _id: currentExam._id,
                name: currentExam.name,
                description: currentExam.description,
                time: currentExam.createdAt,
                isNew: isToday(currentExam.createdAt),
                isDeleted: isStudent ? null : currentExam.isDeleted
            }
            return (preExams.concat(exam));
        }, []);
        let information = value.information.map((info) => {
            return {
                _id: info._id,
                name: info.name,
                content: info.content,
                time: info.createdAt,
                isNew: isToday(info.updatedAt)
            }
        });
        let assignments = value.assignments.reduce((preAssignments, currentAssignment) => {
            if (isStudent && currentAssignment.isDeleted) {
                return preAssignments;
            }

            let assignment = {
                _id: currentAssignment._id,
                name: currentAssignment.name,
                description: currentAssignment.description,
                time: currentAssignment.createdAt,
                isNew: isToday(currentAssignment.createdAt),
                isDeleted: isStudent ? null : currentAssignment.isDeleted
            }
            return (preAssignments.concat(assignment));
        }, []);
        let surveys = value.surveys.reduce((preSurveys, currentSurvey) => {
            if (isStudent && currentSurvey.isDeleted) {
                return preSurveys;
            }

            let survey = {
                _id: currentSurvey._id,
                name: currentSurvey.name,
                description: currentSurvey.description,
                time: currentSurvey.createdAt,
                isNew: isToday(currentSurvey.createdAt),
                isDeleted: isStudent ? null : currentSurvey.isDeleted
            }
            return (preSurveys.concat(survey));
        }, []);

        let files = value.files.reduce((preFiles, currentFile) => {
            if (isStudent && currentFile.isDeleted) {
                return preFiles;
            }

            let file = {
                _id: currentFile._id,
                name: currentFile.name,
                path: currentFile.path,
                type: currentFile.type,
                uploadDay: currentFile.uploadDay,
                isNew: isToday(currentFile.uploadDay),
                isDeleted: isStudent ? null : currentFile.isDeleted
            }
            return (preFiles.concat(file));
        }, []);

        return {
            _id: value._id,
            name: value.name,
            description: value.description,
            surveys: surveys,
            forums: forums,
            exams: exams,
            information: information,
            assignments: assignments,
            files: files,
            index: value.index,
            isDeleted: isStudent ? null : value.isDeleted
        };
    })), ['index']);

    return res;
}

const getDeadlineOfSubject = (subject) => {
    let deadline = [];
    subject.timelines.forEach((timeline) => {
        if (!timeline.isDeleted) {
            let exams = timeline.exams.reduce((preExams, currentExam) => {
                if (currentExam.expireTime.getTime() < today || currentExam.isDeleted) {
                    return preExams;
                }
                var submission = currentExam.submissions.find(value => value.idStudent == req.idStudent)
                let exam = {
                    idTimeline: timeline._id,
                    _id: currentExam._id,
                    name: currentExam.name,
                    expireTime: currentExam.expireTime,
                    timeRemain: (new Date(currentExam.expireTime - today)).getTime(),
                    isSubmit: submission ? true : false,
                    type: 'exam'
                }
                return (preExams.concat(exam));
            }, []);
            let assignments = timeline.assignments.reduce((preAssignments, currentAssignment) => {
                if (currentAssignment.setting.expireTime.getTime() < today || currentAssignment.isDeleted) {
                    return preAssignments;
                }
                let submission = currentAssignment.submissions.find(value => value.idStudent == req.idStudent);
                let assignment = {
                    idTimeline: timeline._id,
                    _id: currentAssignment._id,
                    name: currentAssignment.name,
                    expireTime: currentAssignment.setting.expireTime,
                    timeRemain: (new Date(currentAssignment.setting.expireTime - today)).getTime(),
                    isSubmit: submission ? true : false,
                    type: 'assignment'
                }
                return (preAssignments.concat(assignment));
            }, []);

            let surveys = timeline.surveys.reduce((preSurveys, currentSurvey) => {
                if (currentSurvey.expireTime.getTime() < today || currentSurvey.isDeleted) {
                    return preSurveys;
                }
                let reply = currentSurvey.responses.find(value => value.idStudent == req.idStudent);
                let survey = {
                    idTimeline: timeline._id,
                    _id: currentSurvey._id,
                    name: currentSurvey.name,
                    expireTime: currentSurvey.expireTime,
                    timeRemain: (new Date(currentSurvey.expireTime - today)).getTime(),
                    isSubmit: reply ? true : false,
                    type: 'survey'
                }
                return (preSurveys.concat(survey));
            }, []);

            deadline = deadline.concat(exams, assignments, surveys);
        }
    });
    return deadline;
}