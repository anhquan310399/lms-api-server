const isToday = require('../common/isToday');
const _ = require('lodash');
const mongoose = require("mongoose");
const User = mongoose.model("User");

const getCommonData = (object, isStudent) => {
    return {
        _id: object._id,
        name: object.name,
        description: object.description || undefined,
        content: object.content || undefined,
        time: object.createdAt,
        isNew: isToday(object.createdAt),
        isDeleted: isStudent ? undefined : object.isDeleted
    }
}

const getDetailTimeline = (timeline, isStudent) => {
    const forums = timeline.forums.reduce((preForums, currentForum) => {
        if (isStudent && currentForum.isDeleted) {
            return preForums;
        }
        const forum = getCommonData(currentForum, isStudent);
        return (preForums.concat(forum));
    }, []);
    const exams = timeline.exams.reduce((preExams, currentExam) => {
        if (isStudent && currentExam.isDeleted) {
            return preExams;
        }

        const exam = getCommonData(currentExam, isStudent);
        return (preExams.concat(exam));
    }, []);
    const announcements = timeline.announcements.map((announcement) => {
        return getCommonData(announcement)
    });
    const assignments = timeline.assignments.reduce((preAssignments, currentAssignment) => {
        if (isStudent && currentAssignment.isDeleted) {
            return preAssignments;
        }
        const assignment = getCommonData(currentAssignment, isStudent);
        return (preAssignments.concat(assignment));
    }, []);
    const surveys = timeline.surveys.reduce((preSurveys, currentSurvey) => {
        if (isStudent && currentSurvey.isDeleted) {
            return preSurveys;
        }

        const survey = getCommonData(currentSurvey, isStudent);
        return (preSurveys.concat(survey));
    }, []);

    const files = timeline.files.reduce((preFiles, currentFile) => {
        if (isStudent && currentFile.isDeleted) {
            return preFiles;
        }
        const file = {
            ...getCommonData(currentFile, isStudent),
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

const filterTimelines = async (timelines, isStudent) => {
    const res = _.sortBy(await Promise.all(timelines.map(async (timeline) => {
        return getDetailTimeline(timeline, isStudent);
    })), ['index']);
    return res;
}

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
        let announcements = timeline.announcements.map(info => {
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
            announcements: announcements,
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

const getDeadlineOfSubject = (subject, student) => {
    let deadline = [];
    const today = new Date();
    subject.timelines.forEach((timeline) => {
        if (!timeline.isDeleted) {
            let exams = timeline.exams.reduce((preExams, currentExam) => {
                if (currentExam.expireTime.getTime() < today || currentExam.isDeleted) {
                    return preExams;
                }
                var submission = currentExam.submissions.find(value => value.idStudent == student._id)
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
                let submission = currentAssignment.submissions.find(value => value.idStudent == student._id);
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
                let reply = currentSurvey.responses.find(value => value.idStudent == student._id);
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

const getCommonInfoTopic = async (topic) => {
    const creator = await User.findById(topic.idUser, 'code firstName surName urlAvatar');
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
    let creator = await User.findById(comment.idUser, 'code firstName surName urlAvatar')
    return {
        id: comment._id,
        content: comment.content,
        create: creator,
        time: comment.updatedAt,
        isChanged: comment.createdAt.getTime() === comment.updatedAt.getTime() ? false : true
    }
}

module.exports = {
    getCommonData,
    getDetailTimeline,
    filterTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getSurveyBankExport,
    getQuizBankExport,
    getDeadlineOfSubject,
    getCommonInfoTopic,
    getDetailComment
}