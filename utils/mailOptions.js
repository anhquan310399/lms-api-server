const MailTemplate = {
    SUBJECT_RESET_PWD: '[Account LMS HCMUTE] - Reset password',
    BODY_LINK_RESET_PWD(url) {
        return `Please follow this link to reset your password <a href="${url}">"${url}"</a>`
    }

}

class MailOptions {
    constructor({ to, subject = "no reply this mail", text, html }) {
        this.from = process.env.GM_USERNAME;
        this.to = to;
        this.subject = subject;
        this.text = text;
        this.html = html;
    }
}


module.exports = {
    MailOptions,
    MailTemplate
}