const isToday = require('../common/isToday');
const _ = require('lodash');
const schemaTitle = require("../constants/SchemaTitle");
const mongoose = require("mongoose");
const User = mongoose.model(schemaTitle.USER);
const Course = mongoose.model(schemaTitle.COURSE);
const Semester = mongoose.model(schemaTitle.SEMESTER);
const DETAILS = require('../constants/AccountDetail');
const moment = require('moment');

const getCommonInfo = (object, isStudent) => {
    return {
        _id: object._id,
        name: object.name,
        description: object.description || undefined,
        content: object.content || undefined,
        time: object.createdAt,
        isNew: isToday(object.createdAt || object.uploadDay),
        isDeleted: isStudent ? undefined : object.isDeleted
    }
}

const getConfigInfoOfCourse = async (course) => {
    const teacher = await User.findById(course.idTeacher, DETAILS.COMMON);
    const semester = await Semester.findById(course.idSemester, "name");
    return {
        _id: course._id,
        name: course.name,
        code: course.code,
        teacher,
        semester,
        studentCount: course.studentIds.length,
        idSemester: course.idSemester,
        config: course.config,
        isDeleted: course.isDeleted
    }
}

const getConfigInfoOfUser = (user) => {
    const { _id,
        code,
        idPrivilege,
        emailAddress,
        firstName,
        lastName,
        status,
        urlAvatar } = user

    return {
        _id,
        code,
        idPrivilege,
        emailAddress,
        firstName,
        lastName,
        status,
        urlAvatar
    }
}


const filterAndSortTimelines = async (timelines, isStudent) => {
    if (isStudent) {
        timelines = timelines.filter((value) => {
            return !value.isDeleted;
        });
    }

    const res = _.sortBy(await Promise.all(timelines.map(async (timeline) => {
        return getDetailTimeline(timeline, isStudent);
    })), ['index']);
    return res;
}

const getDetailTimeline = (timeline, isStudent) => {
    const forums = timeline.forums.reduce((preForums, currentForum) => {
        if (isStudent && currentForum.isDeleted) {
            return preForums;
        }
        const forum = getCommonInfo(currentForum, isStudent);
        return (preForums.concat(forum));
    }, []);
    const exams = timeline.exams.reduce((preExams, currentExam) => {
        if (isStudent && currentExam.isDeleted) {
            return preExams;
        }

        const exam = getCommonInfo(currentExam, isStudent);
        return (preExams.concat(exam));
    }, []);
    const announcements = timeline.announcements.map((announcement) => {
        return getCommonInfo(announcement)
    });
    const assignments = timeline.assignments.reduce((preAssignments, currentAssignment) => {
        if (isStudent && currentAssignment.isDeleted) {
            return preAssignments;
        }
        const assignment = getCommonInfo(currentAssignment, isStudent);
        return (preAssignments.concat(assignment));
    }, []);
    const surveys = timeline.surveys.reduce((preSurveys, currentSurvey) => {
        if (isStudent && currentSurvey.isDeleted) {
            return preSurveys;
        }

        const survey = getCommonInfo(currentSurvey, isStudent);
        return (preSurveys.concat(survey));
    }, []);

    const files = timeline.files.reduce((preFiles, currentFile) => {
        if (isStudent && currentFile.isDeleted) {
            return preFiles;
        }
        const file = {
            ...getCommonInfo(currentFile, isStudent),
            name: currentFile.name,
            path: currentFile.path,
            type: currentFile.type,
            uploadDay: currentFile.uploadDay,
        }
        return (preFiles.concat(file));
    }, []);


    return {
        _id: timeline._id,
        name: timeline.name,
        description: timeline.description,
        forums: forums,
        exams: exams,
        announcements: announcements,
        assignments: assignments,
        surveys: surveys,
        files: files,
        index: timeline.index,
        isDeleted: timeline.isDeleted
    };
}

// Not audit

const getListAssignmentAndExam = async (subject, today) => {
    let assignmentOrExam = await (subject.timelines.reduce(
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
                        let exist = exists.find(value => value.idStudent.equals(submission.idStudent));
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

                    const submissions = await Promise.all(assignment.submissions.map(async (submission) => {
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
                let result = (await preField).concat(currentFields);
                return result;
            }
        }, []));
    assignmentOrExam = assignmentOrExam.filter((value) => {
        return (value !== null);
    });

    return assignmentOrExam;
}

const getTimelineExport = async (timelines) => {
    const result = await Promise.all(timelines.map(async (timeline) => {
        const surveys = await Promise.all(timeline.surveys.map(async (survey) => {

            const questionnaire = await Promise.all(survey.questionnaire.map(async (question) => {
                if (question.typeQuestion === 'choice' || question.typeQuestion === 'multiple') {
                    const answers = question.answer.map(answer => {
                        return answer.content;
                    });
                    return {
                        identity:question.identity,
                        content: question.content,
                        answer: answers,
                        typeQuestion: question.typeQuestion
                    }
                } else {
                    return {
                        identity:question.identity,
                        content: question.content,
                        typeQuestion: question.typeQuestion
                    }
                }
            }));

            return {
                name: survey.name,
                description: survey.description,
                setting: survey.setting,
                questionnaire: questionnaire,
            }
        }));

        const forums = timeline.forums.map(forum => {
            return {
                name: forum.name,
                description: forum.description
            }
        });

        const exams = timeline.exams.map(exam => {
            return {
                name: exam.name,
                content: exam.content,
                setting: exam.setting
            }
        });

        const announcements = timeline.announcements.map(info => {
            return {
                name: info.name,
                content: info.content
            }
        });

        const assignments = timeline.assignments.map(assignment => {
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
            announcements: announcements,
            assignments: assignments,
            files: timeline.files,
            index: timeline.index
        }
    }));
    return _.sortBy(result, ['index']);
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

const getDeadlineOfCourse = (course, student) => {
    let deadline = [];
    const today = new Date();
    course.timelines.forEach((timeline) => {
        if (!timeline.isDeleted) {
            let exams = timeline.exams.reduce((preExams, currentExam) => {
                if (currentExam.setting.expireTime.getTime() < today || currentExam.isDeleted) {
                    return preExams;
                }
                var submission = currentExam.submissions.find(value => value.idStudent.equals(student._id))
                let exam = {
                    idSubject: course._id,
                    idTimeline: timeline._id,
                    _id: currentExam._id,
                    name: currentExam.name,
                    expireTime: currentExam.setting.expireTime,
                    timeRemain: (new Date(currentExam.setting.expireTime - today)).getTime(),
                    isSubmit: submission ? true : false,
                    type: 'exam'
                }
                return (preExams.concat(exam));
            }, []);
            let assignments = timeline.assignments.reduce((preAssignments, currentAssignment) => {
                if (currentAssignment.setting.expireTime.getTime() < today || currentAssignment.isDeleted) {
                    return preAssignments;
                }
                let submission = currentAssignment.submissions.find(value => value.idStudent.equals(student._id));
                let assignment = {
                    idSubject: course._id,
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
                let reply = currentSurvey.responses.find(value => value.idStudent.equals(student._id));
                let survey = {
                    idSubject: course._id,
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

const getCommonInfoTopic = async (topic) => {
    const creator = await User.findById(topic.idUser, DETAILS.COMMON);
    return {
        _id: topic._id,
        name: topic.name,
        content: topic.content,
        create: creator,
        createdAt: topic.createdAt,
        replies: topic.discussions ? topic.discussions.length : 0
    }

}

const getDetailComment = async (comment) => {
    let creator = await User.findById(comment.idUser, DETAILS.COMMON)
    return {
        _id: comment._id,
        content: comment.content,
        create: creator,
        time: comment.updatedAt,
        isChanged: comment.createdAt.getTime() === comment.updatedAt.getTime() ? false : true
    }
}

const getInfoQuestionBank = (bank) => {
    return {
        _id: bank._id,
        name: bank.name,
        questionCount: bank.questions.length
    }
}

const getDetailMessage = async (message) => {
    let time = null;
    if (isToday(message.createdAt)) {
        time = moment(message.createdAt).format('hh:mm a');
    } else {
        var duration = moment.duration(moment().diff(message.createdAt));
        var days = duration.asDays();
        time = moment().subtract(days, 'days').calendar();
    }
    const user = await User.findById(message.idUser, DETAILS.COMMON)
    return {
        _id: message._id,
        user,
        message: message.message,
        time: time,
    }
}

const getUserById = async (idUser, detail = DETAILS.COMMON) => {
    return await User.findById(idUser, detail);
}

module.exports = {
    getConfigInfoOfUser,
    getConfigInfoOfCourse,
    getCommonInfo,
    getDetailTimeline,
    filterAndSortTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getQuizBankExport,
    getDeadlineOfCourse,
    getCommonInfoTopic,
    getDetailComment,
    getInfoQuestionBank,
    getDetailMessage,
    getUserById
}