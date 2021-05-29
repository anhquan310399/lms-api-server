const surveyBank = require('../../common/surveyBank');

exports.find = async (req, res) => {
    res.json({
        success: true,
        surveyBank
    })
};
