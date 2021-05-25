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
        ADJUST_INDEX_TIMELINES_SUCCESS:'Adjust index of timeline successfully!',
        
    }
}

module.exports = {
    AdminResponseMessages,
    ClientResponsesMessages
}