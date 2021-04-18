exports.getZoom = (req, res) => {
    const subject = req.subject;
    res.json({
        success: true,
        idRoom: subject._id
    });
}