class MailOptions {
    constructor({ to, subject, text, html }) {
        this.from = process.env.GM_USERNAME;
        this.to = to;
        this.subject = subject;
        this.text = text;
        this.html = html;
    }
}

module.exports = {
    MailOptions
}