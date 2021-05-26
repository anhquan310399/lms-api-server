const { getCurrentSemester } = require('../common/getCurrentSemester');
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');

exports.checkSemester = async (req, res, next) => {
    const currentCourse = await getCurrentSemester();

    // if (!currentCourse._id.equals(subject.idCourse)) {
    //     return next(new HttpUnauthorized("Subject was out of current course!"));
    // }

    req.currentCourse = currentCourse;
    next();
}
