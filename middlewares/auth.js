const jwt = require('jsonwebtoken')
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Subject = mongoose.model("Subject");
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');

exports.authStudent = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({ _id: data._id, code: data.code, idPrivilege: 'student', isDeleted: false })
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                var idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                const subject = await Subject.findOne({ _id: idSubject, 'studentIds': user.code });
                if (subject) {
                    req.subject = subject;
                    req.student = user;
                    req.idPrivilege = user.idPrivilege;
                    next();
                } else {
                    next(new HttpNotFound({ message: "Not found subject that you enroll" }));
                }
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
        User.findOne({ _id: data._id, code: data.code, idPrivilege: 'teacher', isDeleted: false })
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }

                var idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                const subject = await Subject.findOne({ _id: idSubject, idLecture: user.code })
                if (subject) {
                    req.subject = subject;
                    req.lecture = user;
                    req.idPrivilege = user.idPrivilege;
                    next();
                } else {
                    next(new HttpNotFound({ message: "Not found this subject" }));
                }

            })
            .catch((err) => {
                console.log("authLecture - Find Student", error);
                next(err);
            });
    } catch (error) {
        console.log("Auth Lecture", error);
        next(new HttpUnauthorized());
    }
}

exports.authInSubject = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({ _id: data._id, code: data.code, isDeleted: false })
            .then(async(user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;

                let subject = null;
                if (user.idPrivilege === "student") {
                    subject = await Subject.findOne({ _id: idSubject, isDeleted: false, 'studentIds': user.code })
                } else if (user.idPrivilege === "teacher") {
                    subject = await Subject.findOne({ _id: idSubject, isDeleted: false, idLecture: user.code })
                }
                if (subject) {
                    req.user = user;
                    req.subject = subject;
                    req.idPrivilege = user.idPrivilege;
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

exports.authLogin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({ _id: data._id, code: data.code, isDeleted: false })
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authLogin - Find user", error);
                next(err);
            });
    } catch (error) {
        console.log("Auth login", error);
        next(new HttpUnauthorized());
    }
}

exports.authAdmin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
            //console.log(token);
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({ _id: data._id, code: data.code, idPrivilege: 'admin' })
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authAdmin - Find user", error);
                next(err);
            });
    } catch (error) {
        console.log("Auth Admin", error);
        next(new HttpUnauthorized());
    }
}