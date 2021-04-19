const jwt = require('jsonwebtoken')
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Subject = mongoose.model("Subject");
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');
const STATUS = require('../constants/AccountStatus');
const DETAILS = require('../constants/AccountDetail');
const PRIVILEGES = require('../constants/PrivilegeCode');

exports.authStudentInSubject = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.REGISTER,
                status: STATUS.ACTIVATED
            }, DETAILS.AUTH)
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                const subject = await Subject.findOne({ _id: idSubject, 'studentIds': user._id });
                if (subject) {
                    req.subject = subject;
                    req.student = user;
                    next();
                } else {
                    next(new HttpNotFound({ message: "Not found subject that you enroll" }));
                }
            })
            .catch((err) => {
                console.log("authStudentInSubject - Find Student", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth Student in Subject", error);
        next(new HttpUnauthorized());
    };
}

exports.authLectureInSubject = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                idPrivilege: PRIVILEGES.TEACHER,
                status: STATUS.ACTIVATED
            }, DETAILS.AUTH)
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                const subject = await Subject.findOne({ _id: idSubject, idLecture: user._id })
                if (subject) {
                    req.subject = subject;
                    req.lecture = user;
                    next();
                } else {
                    next(new HttpNotFound({ message: "Not found this subject" }));
                }
            })
            .catch((err) => {
                console.log("authLectureInSubject - Find lecture", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth Lecture in Subject", error);
        next(new HttpUnauthorized());
    }
}

exports.authInSubject = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                status: STATUS.ACTIVATED
            }, DETAILS.AUTH)
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                let subject = null;
                if (user.idPrivilege === PRIVILEGES.STUDENT) {
                    subject = await Subject.findOne({ _id: idSubject, isDeleted: false, 'studentIds': user._id })
                } else if (user.idPrivilege === PRIVILEGES.TEACHER) {
                    subject = await Subject.findOne({ _id: idSubject, isDeleted: false, idLecture: user._id })
                }
                if (subject) {
                    req.user = user;
                    req.subject = subject;
                    next();
                } else {
                    next(new HttpNotFound({ message: "Not found this subject" }));
                }
            })
            .catch((err) => {
                console.log("authInSubject - Find user", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth in Subject", error);
        next(new HttpUnauthorized());
    }
}

exports.authStudent = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.REGISTER,
                status: STATUS.ACTIVATED
            }, DETAILS.AUTH)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.student = user;
                next();
            })
            .catch((err) => {
                console.log("authStudent - Find Student", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth Student", error);
        next(new HttpUnauthorized());
    };
}

exports.authLecture = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                idPrivilege: PRIVILEGES.TEACHER,
                status: STATUS.ACTIVATED
            }, DETAILS.AUTH)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.lecture = user;
                next();
            })
            .catch((err) => {
                console.log("authLecture - Find Lecture", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth Lecture", error);
        next(new HttpUnauthorized());
    }
}

exports.authLogin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                status: STATUS.ACTIVATED
            }, DETAILS.LOGIN)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authLogin - Find user", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth login", error);
        next(new HttpUnauthorized());
    }
}

exports.authUser = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                status: STATUS.ACTIVATED,
                idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.TEACHER || PRIVILEGES.REGISTER
            }, DETAILS.AUTH)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authUser - Find user", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth user", error);
        next(new HttpUnauthorized());
    }
}

exports.authAdmin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
                _id: data._id,
                idPrivilege: PRIVILEGES.ADMIN
            }, DETAILS.AUTH)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authAdmin - Find admin", err);
                next(err);
            });
    } catch (error) {
        console.log("Auth admin", error);
        next(new HttpUnauthorized());
    }
}