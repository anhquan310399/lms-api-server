const { getCurrentSemester } = require('../common/getCurrentSemester');
const { HttpUnauthorized, HttpNotFound } = require('../utils/errors');

exports.checkSemester = async (req, res, next) => {
    const currentSemester = await getCurrentSemester();
    if (req.course?.config.role === 'private') {


        if (!currentSemester._id.equals(req.course.idSemester)) {
            return next(new HttpUnauthorized("Course was out of current semester!"));
        }
    }

    req.currentSemester = currentSemester;
    next();
}
