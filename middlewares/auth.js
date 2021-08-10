const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const Course = mongoose.model(schemaTitle.COURSE);
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');
const STATUS = require('../constants/AccountStatus');
const DETAILS = require('../constants/AccountDetail');
const PRIVILEGES = require('../constants/PrivilegeCode');
const { AuthResponseMessages } = require('../constants/ResponseMessages');

exports.authStudentInCourse = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            status: STATUS.ACTIVATED,
            $or: [{ idPrivilege: PRIVILEGES.STUDENT }, { idPrivilege: PRIVILEGES.REGISTER, }],

        }, DETAILS.DEFAULT)
            .then(async (user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idCourse = req.params.idCourse || req.query.idCourse || req.body.idCourse;

                const course = await Course.findOne({ _id: idCourse, 'studentIds': user._id });
                if (course) {
                    req.course = course;
                    req.student = user;
                    next();
                } else {
                    next(new HttpNotFound(AuthResponseMessages.NOT_FOUND_COURSE));
                }
            })
            .catch((err) => {
                console.log("authStudentInCourse", err).message;
                next(err);
            });
    } catch (error) {
        console.log("authStudentInCourse", error.message);
        next(new HttpUnauthorized());
    };
}

exports.authTeacherInCourse = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            idPrivilege: PRIVILEGES.TEACHER,
            status: STATUS.ACTIVATED,

        }, DETAILS.DEFAULT)
            .then(async (user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idCourse = req.params.idCourse || req.query.idCourse || req.body.idCourse;

                const course = await Course.findOne({ _id: idCourse, idTeacher: user._id })
                if (course) {
                    req.course = course;
                    req.teacher = user;
                    next();
                } else {
                    next(new HttpNotFound(AuthResponseMessages.NOT_FOUND_COURSE));
                }
            })
            .catch((err) => {
                console.log("authTeacherInCourse", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authTeacherInCourse", error.message);
        next(new HttpUnauthorized());
    }
}

exports.authInCourse = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            status: STATUS.ACTIVATED,
        }, DETAILS.DEFAULT)
            .then(async (user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                const idCourse = req.params.idCourse || req.query.idCourse || req.body.idCourse;

                const course = await Course.findOne({
                    _id: idCourse,
                    isDeleted: false,
                    $or: [{
                        'studentIds': user._id
                    }, {
                        idTeacher: user._id
                    }]
                });

                const isStudent = user.idPrivilege !== PRIVILEGES.TEACHER ? true : false;

                if (course) {
                    req.user = user;
                    req.course = course;
                    req.isStudent = isStudent;
                    next();
                } else {
                    next(new HttpNotFound(AuthResponseMessages.NOT_FOUND_COURSE));
                }
            })
            .catch((err) => {
                console.log("authInCourse", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authInCourse", error.message);
        next(new HttpUnauthorized());
    }
}

exports.authStudent = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            status: STATUS.ACTIVATED,
            $or: [{ idPrivilege: PRIVILEGES.STUDENT }, { idPrivilege: PRIVILEGES.REGISTER, }],

        }, DETAILS.DEFAULT)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.student = user;
                next();
            })
            .catch((err) => {
                console.log("authStudent", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authStudent", error.message);
        next(new HttpUnauthorized());
    };
}

exports.authTeacher = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            idPrivilege: PRIVILEGES.TEACHER,
            status: STATUS.ACTIVATED,
        }, DETAILS.DEFAULT)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.teacher = user;
                next();
            })
            .catch((err) => {
                console.log("authLecture", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authTeacher", error.message);
        next(new HttpUnauthorized());
    }
}

exports.authLogin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            status: STATUS.ACTIVATED,
        })
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authLogin", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authLogin", error.message);
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
            $or: [{ idPrivilege: PRIVILEGES.STUDENT },
            { idPrivilege: PRIVILEGES.REGISTER, },
            { idPrivilege: PRIVILEGES.TEACHER, }],
        }, DETAILS.DEFAULT)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authUser", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authUser", error.message);
        next(new HttpUnauthorized());
    }
}

exports.authAdmin = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        User.findOne({
            _id: data._id,
            idPrivilege: PRIVILEGES.ADMIN,
            status: STATUS.ACTIVATED,
        }, DETAILS.DEFAULT)
            .then((user) => {
                if (!user) {
                    next(new HttpUnauthorized());
                }
                req.user = user;
                next();
            })
            .catch((err) => {
                console.log("authAdmin", err.message);
                next(err);
            });
    } catch (error) {
        console.log("authAdmin", error.message);
        next(new HttpUnauthorized());
    }
}