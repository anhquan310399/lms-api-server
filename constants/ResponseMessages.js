const STATUS = require('./AccountStatus');

const AdminResponseMessages = {
    FacultyResponseMessages: {
        CREATE_SUCCESS: 'Create new faculty successfully!',
        NOT_FOUND(id) {
            return `Not found faculty with id - ${id}`
        },
        UPDATE_SUCCESS: 'Update faculty successfully!',
        DELETE_SUCCESS: 'Delete faculty successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Lock' : 'Unlock'} faculty '${name}' successfully!`
        },
    },
    PrivilegeResponseMessages: {
        CREATE_SUCCESS: 'Create new privilege successfully!',
        NOT_FOUND_BY_ROLE(role) {
            return `Not found privilege with role ${role}`
        },
        UPDATE_SUCCESS: 'Update role successfully!',
        DELETE_SUCCESS: 'Delete role successfully!',
    },
    SemesterResponseMessages: {
        CREATE_SUCCESS(name) {
            return `Add new semester '${name}' successfully`
        },
        NOT_FOUND_BY_ID(id) {
            return `Not found semester with id ${id}`
        },
        UPDATE_SUCCESS: 'Update semester successfully!',
        SET_CURRENT(name) {
            return `Set '${name}' to current semester successfully!`
        }
    },
    CourseResponseMessages: {
        CREATE_SUCCESS(name) {
            return `Create new course ${name} successfully!`
        },
        NOT_FOUND(id) {
            return `Not found course with id - ${id}`
        },
        UPDATE_SUCCESS: 'Update course successfully!',
        DELETE_SUCCESS(name) {
            return `Delete Subject ${name} Successfully`
        },
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Lock' : 'Unlock'} course '${name}' successfully!`
        },
        NOT_FOUND_CLASS(id) {
            return `Not found class with id - ${id}`
        },
        NOT_FOUND_SUBJECT(id) {
            return `Not found subject with id - ${id}`
        }
    },
    UserResponseMessages: {
        CREATE_SUCCESS(role) {
            return `Create new ${role} successfully!`
        },
        NOT_FOUND_BY_ID(id) {
            return `Not found user with id - ${id}`
        },
        LOCK_MESSAGE({ status, lastName, firstName, role }) {
            return `${status === STATUS.SUSPENDED ? 'Lock' : 'Unlock'} ${role} '${firstName + ' ' + lastName}' successfully!`
        }
    },
    CurriculumResponseMessages: {
        CREATE_SUCCESS: 'Create new curriculum successfully!',
        NOT_FOUND(id) {
            return `Not found curriculum with id - ${id}`
        },
        UPDATE_SUCCESS: 'Update curriculum successfully!',
        DELETE_SUCCESS: 'Delete curriculum successfully!',
    },
    SubjectResponseMessages: {
        CREATE_SUCCESS: 'Create new subject successfully!',
        NOT_FOUND(id) {
            return `Not found subject with id - ${id}`
        },
        UPDATE_SUCCESS: 'Update subject successfully!',
        DELETE_SUCCESS: 'Delete subject successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Lock' : 'Unlock'} subject '${name}' successfully!`
        }
    },
    ClassResponseMessages: {
        CREATE_SUCCESS: 'Create new class successfully!',
        NOT_FOUND(id) {
            return `Not found class with id - ${id}`
        },
        UPDATE_SUCCESS: 'Update class successfully!',
        DELETE_SUCCESS: 'Delete class successfully!',
        ADD_STUDENTS_SUCCESS: 'Add students to class successfully!',
        UPDATE_STUDENTS_SUCCESS: 'Update students of class successfully!'
    }
}

const ClientResponsesMessages = {
    UserResponseMessages: {
        EMAIL_EXISTED: 'Email address was already existed!',
        USERNAME_EXISTED: 'Username was already existed!',
        REQUEST_LOGIN_BY_EMAIL: 'Please login via email to activate account first!',
        NOT_FOUND_WITH_EMAIL(email) {
            return `Search returns no results with this email '${email}'.`
        },
        REQUEST_RESET_PWD_LIMIT: 'You do have to wait 10 minutes after each requesting to reset your password',
        REQUEST_RESET_PWD_SUCCESS: 'Check your email to get link reset password!',
        REQUEST_RESET_PWD_EXPIRED: 'Your request has been expired!',
        RESET_PWD_SUCCESS: 'Reset password successfully!',
        UPDATE_PWD_INVALID: 'Password is not valid',
        UPDATE_PWD_SUCCESS: `Update password successfully`,
        UPDATE_PROFILE_SUCCESS: `Update profile successfully`,
        AUTHENTICATE_NOT_FOUND: 'Authentication failed. User not found',
        AUTHENTICATE_PWD_INVALID: 'Authentication failed. Wrong password!',
        AUTHENTICATE_SUCCESS: 'Login successfully!',
        AUTHENTICATE_BY_EMAIL_NOT_FOUND(email) {
            return `Not found user with email '${email}'`
        },
        AUTHENTICATE_BY_FACEBOOK_ERROR: 'Error while verify facebook access token',
        AUTHENTICATE_BY_FACEBOOK_NOT_FOUND: `Not found user with this facebook`,
        ACCOUNT_SUSPENDED: 'Your account has been suspended!',
        ACCOUNT_NOT_ACTIVATED: 'Please login via email to activate account first!',
        ACCOUNT_LINKED_FACEBOOK: 'Your account has already linked facebook account!',
        FACEBOOK_LINK_ANOTHER_ACCOUNT: 'This facebook account is linked with another account!',
        ACCOUNT_LINK_FACEBOOK_SUCCESS(fbName) {
            return `Link to facebook ${fbName} successfully!`
        },
        ACCOUNT_NOT_LINKED_FACEBOOK: `Your account hasn't already linked facebook!`,
        ACCOUNT_UNLINK_FACEBOOK_SUCCESS: `UnLink to facebook successfully!`
    },
    ChatResponseMessages: {
        ROOM_EXISTED: 'Chatroom with that user already exists!',
        CREATE_ROOM_SUCCESS: 'Chatroom created!',
        ROOM_NOT_FOUND: 'Not found chat room!',
    },
    CourseResponseMessages: {
        CREATE_COURSE_SUCCESS(courseName) {
            return `Create new course ${courseName} successfully!`
        },
        COURSE_NOT_FOUND: 'Not found course',
        UPDATE_CONFIG_SUCCESS: 'Update config of course successfully',
        ENROLL_COURSE_PROHIBIT: 'This course can not enroll!',
        ENROLL_COURSE_REQUESTED: 'You have already requested to enroll this course!',
        EXISTED_IN_COURSE: 'You have already in course',
        ENROLL_COURSE_REQUEST_STATUS(isAcceptEnroll) {
            return isAcceptEnroll ?
                'You have been accepted to enroll this course!' : 'Your request has been send to the lecture. Wait!!!';
        },
        STUDENT_ALREADY_IN_COURSE: 'This student has already in course',
        REQUEST_NOT_FOUND: 'This student has already in course',
        ACCEPT_ENROLL_SUCCESS: 'Accept enroll request successfully!',
        DENY_ENROLL_SUCCESS: 'Deny enroll request successfully!',
        EXIT_COURSE_SUCCESS: 'You has just exit this course',
        EXIT_COURSE_REQUESTED: 'You have already request to exit this course!',
        EXIT_COURSE_SENT: 'Your request has already sent to the teacher!',
        ACCEPT_EXIT_SUCCESS: 'Accept exit request successfully!',
        DENY_EXIT_SUCCESS: 'Deny exit request successfully!',
        NOT_FOUND_STUDENT_WITH_CODE(code) {
            return `Not found student with code: ${code}`
        },
        ADD_STUDENT_SUCCESS(code) {
            return `Add Student with code '${code}' successfully!`;
        },
        NOT_FOUND_STUDENT_IN_COURSE: `Not found this student in course`,
        REMOVE_STUDENT_SUCCESS: 'Remove student successfully!',
        ADJUST_INDEX_TIMELINES_SUCCESS: 'Adjust index of timeline successfully!',
        COURSE_HAS_TIMELINES: 'Course already has data. Cant not import new data',
        IMPORT_DATA_SUCCESS: 'Import data to course successfully!',
    },
    TimelineResponseMessages: {
        CREATE_SUCCESS: 'Create timeline successfully!',
        UPDATE_SUCCESS: 'Update timeline successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Hide' : 'Show'} timeline ${name} successfully!`
        },
        UPLOAD_FILE_SUCCESS: 'Upload file successfully!',
        DELETE_FILE_SUCCESS: 'Delete file successfully!'
    },
    AnnounceResponseMessages: {
        CREATE_SUCCESS: 'Create new announcement successfully!',
        UPDATE_SUCCESS: 'Update announcement successfully!',
        DELETE_SUCCESS: 'Delete information successfully!',
    },
    AssignResponseMessages: {
        CREATE_SUCCESS: 'Create new assignment successfully!',
        UPDATE_SUCCESS: 'Update assignment successfully!',
        DELETE_SUCCESS: 'Delete assignment successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Hide' : 'Show'} assignment ${name} successfully!`
        },
        SUBMISSION_IS_GRADED: `Assignment was graded, can't submit!`,
        ASSIGNMENT_NOT_OPEN: `The assignment has been not opened`,
        ASSIGNMENT_IS_OVERDUE: 'The assignment is overdue',
        NOT_FOUND_SUBMISSION: 'Not found submission',
        GRADE_SUBMISSION_SUCCESS({ code: studentCode }) {
            `Grade submission of student with code: ${studentCode} successfully!`
        },
        SUBMISSION_IS_GRADED_CANT_COMMENT: `The submission hasn't been graded. Can't comment`,
        COMMENT_FEEDBACK_SUBMISSION_SUCCESS: 'Comment feedback of submission successfully!',
    },
    ForumResponseMessages: {
        CREATE_SUCCESS: 'Create new forum successfully!',
        UPDATE_SUCCESS: 'Update forum successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Hide' : 'Show'} forum ${name} successfully!`
        },
        DELETE_SUCCESS: 'Delete forum successfully!'
    },
    TopicResponseMessages: {
        CREATE_SUCCESS: 'Create new topic successfully!',
        TOPIC_IS_NOT_OWN: `You isn't the topic creator. You can't change this topic!`,
        UPDATE_SUCCESS: 'Update topic successfully!',
        DELETE_SUCCESS: 'Delete topic successfully!',
        NOT_FOUND_DISCUSSION: 'Not found discussion',
        DISCUSSION_IS_NOT_OWN: `You isn't the discussion creator. You can't change this discussion!`,
        UPDATE_DISCUSSION_SUCCESS: 'Update discussion successfully!',
        DELETE_DISCUSSION_SUCCESS: `Delete Discussion Successfully!`,
    },
    ExamResponseMessages: {
        CREATE_SUCCESS: 'Create new exam successfully',
        EXAM_HAS_SUBMISSION: `Exam already has submissions. Can't change setting of exam!`,
        UPDATE_SUCCESS: 'Update exam successfully!',
        DELETE_SUCCESS: 'Delete exam successfully!',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Hide' : 'Show'} exam ${name} successfully!`;
        },
        SUBMIT_SUCCESS: 'Submit submission successfully!',
        NOT_FOUND_SUBMISSION: 'Not found submission!',
        IS_SUBMITTED: 'You have already submitted!',
        TIME_OUT: 'Test time out',
        NUMBER_ATTEMPT_RUN_OUT: 'The number of entries has been exceeded!',
        EXAM_NOT_OPEN: `The exam has been not opened`,
        EXAM_IS_OVERDUE: 'The exam is overdue',
    },
    SurveyResponseMessages: {
        CREATE_SUCCESS: 'Create new survey successfully',
        UPDATE_SUCCESS: 'Update this survey successfully',
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Hide' : 'Show'} survey ${name} successfully!`;
        },
        DELETE_SUCCESS: 'Delete this survey successfully',
        SURVEY_ALREADY_REPLIED: `You have already replied this survey`,
        REPLY_SURVEY_SUCCESS: `Reply survey successfully!`,
        SURVEY_NOT_REPLIED: `You have not already replied this survey`,
        QUESTIONS_NOT_VALID: `Questions of survey are invalid!`
    },
    QuizBankResponseMessages: {
        NOT_FOUND_CHAPTER: 'Not found questionnaire',
        UPDATE_CHAPTER_SUCCESS: 'Update chapter successfully!',
        DELETE_CHAPTER_SUCCESS: 'Delete this chapter successfully',

    }
}

const AuthResponseMessages = {
    NOT_FOUND_COURSE: 'Not found course"'
}

module.exports = {
    AdminResponseMessages,
    ClientResponsesMessages,
    AuthResponseMessages
}