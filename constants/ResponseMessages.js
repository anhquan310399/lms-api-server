const STATUS = require('./AccountStatus');

const AdminResponseMessages = {
    FacultyResponseMessages: {
        CREATE_SUCCESS: "Create new faculty successfully!",
        NOT_FOUND(id) {
            return `Not found faculty with id - ${id}`
        },
        UPDATE_SUCCESS: "Update faculty successfully!",
        DELETE_SUCCESS: "Delete faculty successfully!",
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Lock' : 'Unlock'} faculty "${name}" successfully!`
        },
    },
    PrivilegeResponseMessages: {
        CREATE_SUCCESS: "Create new privilege successfully!",
        NOT_FOUND_BY_ROLE(role) {
            return `Not found privilege with role ${role}`
        },
        UPDATE_SUCCESS: "Update role successfully!",
        DELETE_SUCCESS: "Delete role successfully!",
    },
    SemesterResponseMessages: {
        CREATE_SUCCESS(name) {
            return `Add new semester "${name}" successfully`
        },
        NOT_FOUND_BY_ID(id) {
            return `Not found semester with id ${id}`
        },
        UPDATE_SUCCESS: "Update semester successfully!",
        SET_CURRENT(name) {
            return `Set "${name}" to current semester successfully!`
        }
    },
    CourseResponseMessages: {
        CREATE_SUCCESS(name) {
            return `Create new course ${name} successfully!`
        },
        NOT_FOUND(id) {
            return `Not found course with id - ${id}`
        },
        UPDATE_SUCCESS: "Update course successfully!",
        DELETE_SUCCESS(name) {
            return `Delete Subject ${name} Successfully`
        },
        LOCK_MESSAGE({ isDeleted: status, name }) {
            return `${status ? 'Lock' : 'Unlock'} course "${name}" successfully!`
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
            return `${status === STATUS.SUSPENDED ? 'Lock' : 'Unlock'} ${role} "${firstName + " " + lastName}" successfully!`
        }
    }
}

module.exports = {
    AdminResponseMessages,
}