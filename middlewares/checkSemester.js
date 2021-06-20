const { getCurrentSemester } = require('../common/getCurrentSemester');
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');

exports.checkSemester = async (req, res, next) => {

    if (req.course.config.role === 'private') {
        const currentSemester = await getCurrentSemester();

        if (!currentSemester._id.equals(course.idSemester)) {
            return next(new HttpUnauthorized("Course was out of current semester!"));
        }
    }

    req.currentSemester = currentSemester;
    next();
}
