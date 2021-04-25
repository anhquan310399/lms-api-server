const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const { getCurrentCourse } = require('../common/getCurrentCourse');
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');

exports.checkCourse = async (req, res, next) => {
    let subject
    if (!req.subject) {
        const idSubject = req.params.idSubject || req.query.idSubject || req.body.idSubject;
        subject = await Subject.findById(idSubject);
    } else {
        subject = req.subject;
    }

    const currentCourse = await getCurrentCourse();
    if (!currentCourse._id.equals(subject.idCourse)) {
        next(new HttpUnauthorized("Subject was out of current course!"));
    }
    req.currentCourse = currentCourse;
    next();
}
