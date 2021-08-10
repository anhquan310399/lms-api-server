const handlebars = require('handlebars');
const fs = require('fs');

const readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};

const MailTemplate = {
    SUBJECT_RESET_PWD: '[Account LMS HCMUTE] - Reset password',
    BODY_LINK_RESET_PWD(homeUrl, resetUrl) {
        return new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/mail-templates/reset-password.html', function (err, html) {
                var template = handlebars.compile(html);
                var replacements = {
                    homeUrl: homeUrl,
                    resetUrl: resetUrl
                };
                var htmlToSend = template(replacements);
                resolve(htmlToSend);
            });
        })
        //return `Please follow this link to reset your password <a href="${url}">"${url}"</a>`
    },
    MAIL_NOTIFY_STUDENT_ENROLL(student, teacher, course) {
        return new MailOptions({
            to: teacher.emailAddress,
            subject: `[${course.name}] - New Student Enroll`,
            text: `Student: ${student.firstName
                + " " + student.lastName}, 
                MSSV: ${student.code} has just enrolled your course [${course.name}]`

        })
    },
    MAIL_NOTIFY_STUDENT_REQUEST_ENROLL(student, teacher, course) {
        return new MailOptions({
            to: teacher.emailAddress,
            subject: `[${course.name}] - New Enroll Request`,
            text: `Student: ${student.firstName
                + " " + student.lastName}, 
                MSSV: ${student.code} has just requested enroll your course [${course.name}]`
        });
    },
    MAIL_NOTIFY_ENROLL_REQUEST_PROCESS(student, course, isAccept) {
        return new MailOptions({
            to: student.emailAddress,
            subject: `[${course.name}] - ${isAccept ? 'Accept' : 'Deny'} Enroll Request`,
            text: `Your request to enroll course [${course.name}] has just ${isAccept ? 'accepted' : 'denied'}!`
        });
    },
    MAIL_NOTIFY_EXIT_COURSE_REQUEST(student, teacher, course) {
        return new MailOptions({
            to: teacher.emailAddress,
            subject: `[${course.name}] - Request Exit Course`,
            text: `Student: ${student.firstName
                + " " + student.lastName}, 
                MSSV: ${student.code} has just request to exit your course [${course.name}]`
        });
    },
    MAIL_NOTIFY_EXIT_COURSE_PROCESS(student, course, isAccept) {
        return new MailOptions({
            to: student.emailAddress,
            subject: `[${course.name}] - ${isAccept ? 'Accept' : 'Deny'} Exit Request`,
            text: `Your request to exit course [${course.name}] has just ${isAccept ? 'accepted' : 'denied'}!`
        });
    },
    MAIL_CONFIRM_SUBMIT_ASSIGNMENT(student, assignment, course) {
        return new MailOptions({
            to: student.emailAddress,
            subject: 'No reply this email',
            text: `You currently submit to assignment "${assignment.name}" in course "${course.name}"`
        });
    },
    MAIL_NOTIFY_SUBMISSION_IS_GRADED(student, assignment, course) {
        return new MailOptions({
            to: student.emailAddress,
            course: 'No reply this email',
            text: `Your submission for assignment "${assignment.name}" in course "${course.name}" is currently graded`
        });
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