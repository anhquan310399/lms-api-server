const FacultyValidate = {
    NAME: 'Name of faculty is required',
    CODE: 'Code of faculty is required',
    TYPE_CODE: 'Type of code is Number',
    NOT_FOUND_CURRICULUM(idCurriculum) {
        return `Not found curriculum with _id: ${idCurriculum}`
    }
}

const SemesterValidate = {
    NAME: 'Name of semester is required',
}

const CurriculumValidate = {
    NAME: 'Name of curriculum is required',
    CODE: 'Code of curriculum is required',
    NOT_FOUND_SUBJECT(idSubject) {
        return `Not found subject with _id: ${idSubject}`
    },
    NOT_FOUND_CLASS(idClass) {
        return `Not found class with _id: ${idClass}`
    }
}

const SubjectValidate = {
    NAME: 'Name of subject is required',
    CODE: 'Code of subject is required',
    CREDIT: 'Credit of subject is required',
    MIN_CREDIT: 'Min credit is 1',
    TYPE_CREDIT: 'Type of credit is Number'
}

const ClassValidate = {
    NAME: 'Name of class is required',
    CODE: 'Code of class is required',
    NOT_FOUND_STUDENT(idStudent) {
        return `Not found student with _id: ${idStudent}`
    }
}

const ChatroomValidate = {
    NOT_FOUND_USER(id) {
        return `Not found user with _id: ${id}`
    },
    CREATE_WITHOUT_USER: `Can't create room without user`
}

const MessageValidate = {
    ID_CHATROOM: 'Id of chatroom is required',
    ID_USER: 'Id of user is required',
    MESSAGE: 'Message is required',
}

const PrivilegeValidate = {
    ROLE: 'Role is required',
    NAME: 'Name of privilege is required'
}

const UserValidate = {
    CODE: 'Code is required',
    CODE_UNIQUE: 'Code is existed',
    ID_PRIVILEGE: 'idPrivilege is required',
    NOT_FOUND_PRIVILEGE(role) {
        return `Not found privilege: ${role}`
    },
    EMAIL: 'Email address is required',
    EMAIL_UNIQUE: `Email is existed`,
    EMAIL_INVALID: 'Invalid Email address',
    EMAIL_NOT_IN_SYSTEM: 'Email address not in HCMUTE',
    FIRST_NAME: 'First name is required',
    LAST_NAME: 'Last name is required',
    STATUS: 'Status of user account is required',
}

const CourseValidate = {
    ROLE: 'Role of course is required',
    ROLE_ENUM: 'Role of course is only public and private',
    NAME: 'Name of course is required',
    ID_SEMESTER: 'Id semester is required',
    NOT_FOUND_SEMESTER(id) {
        return `Not found semester with id - ${id}`
    },
    CONFIG: 'Config of course is required',
    ID_TEACHER: 'Id teacher is required',
    NOT_FOUND_TEACHER(id) {
        return `Not found teacher with id - ${id}`
    },
    NOT_FOUND_STUDENT(id) {
        return `Not found student with id: ${id}`
    },
    ID_SUBJECT: 'Id subject is required',
    NOT_FOUND_SUBJECT(id) {
        return `Not found subject with id - ${id}`
    },
    CODE: 'Code of course is required'
}

const TimelineValidate = {
    NAME: 'Name of timeline is required',
}

const AnnouncementValidate = {
    NAME: 'Title of announcement is required',
    CONTENT: 'Content of announcement is required'
}

const AssignmentValidate = {
    GRADE: 'Grade is required',
    GRADE_MIN: 'Min grade is 0',
    GRADE_MAX: 'Max grade is 10',
    SUBMISSION_FILE: 'Please attach file before uploading',
    SETTING_START_TIME: 'Start time of assignment is required',
    SETTING_EXPIRE_TIME: 'Expire time of assignment is required',
    SETTING_EXPIRE_TIME_VALID: 'Expire time must be more than start time',
    SETTING_OVERDUE_DATE: 'Over due date is required',
    SETTING_OVERDUE_DATE_VALID: 'Over due date must be more than expire time',
    SETTING_FILE_SIZE_MIN: 'Min size of file is 5mb',
    SETTING_FILE_SIZE_MAX: 'Max size of file is 500mb',
    NAME: 'Title of assignment is required',
    CONTENT: 'Description of assignment is required',
    SETTING: 'Setting of assignment is required',
}

const CommentValidate = {
    CONTENT: 'Content of comment is required'
}

const FileValidate = {
    NAME: 'Name of file is required',
    TYPE: 'Type of file is required',
    PATH: 'Path of file is required'
}

const ForumValidate = {
    NAME: 'Title of forum is required',
}

const TopicValidate = {
    NAME: 'Title of Topic is required',
    CONTENT: 'Content of Topic is required',
}

const QuestionValidate = {
    CONTENT: 'Content of question is required',
    TYPE: 'Type of question is required',
    ANSWER: 'Answer of question is required',
    ANSWER_CONTENT: 'Content of answer is required'
}

const SurveyValidate = {
    NAME: 'Name of survey is required',
    SETTING_START_TIME: 'Start time of exam is required',
    SETTING_EXPIRE_TIME: 'Expire time of exam is required',
    SETTING_EXPIRE_TIME_VALID: 'Expire time must be more than start time',
    QUESTIONNAIRE: 'Questionnaire of survey is required'
}

const SurveyResponseValidate = {
    INCOMPLETE: 'PLease fill all answer of questionnaire',
    NOT_FOUND_QUESTION(id) {
        return `Can not found question ${id} in questionnaire`
    },
    NOT_FOUND_ANSWER(idAnswer, question) {
        `Can not found answer ${idAnswer} in question ${question}`
    }
}

const QuestionnaireValidate = {
    NAME: 'Name of questionnaire is required',
    QUESTIONS: 'questionnaire must have questions'
}

const ExamValidate = {
    NAME: "Name of exam is required",
    CONTENT: "Requirement of exam is required",
    SETTING: "Setting of exam is required",
    SETTING_QUESTIONNAIRE: "Questionnaire is required",
    SETTING_QUESTIONNAIRE_ID: "Id of questionnaire is required",
    SETTING_QUESTION_COUNT(idQuestionnaire) {
        `Amount questions of questionnaire "${idQuestionnaire}" is required`
    },
    SETTING_QUESTION_COUNT_MIN: "Min of amount questions is 1",
    SETTING_TIME_TO_DO: "Time to do of exam is required",
    SETTING_TIME_TO_DO_MIN: "Min of time to do is 15",
    SETTING_ATTEMPT_COUNT: "Attempt count of exam is required",
    SETTING_ATTEMPT_COUNT_MIN: "Min of attempt count is 1",
    SETTING_START_TIME: "Start time of exam is required",
    SETTING_EXPIRE_TIME: "Expire time of exam is required",
    SETTING_EXPIRE_TIME_VALID: "Expire time must be more than start time",
    NOT_FOUND_QUESTIONNAIRE(id) {
        return `Can't not found questionnaire with ${id} in quiz bank!`
    },
    QUESTIONNAIRE_HAS_LOWER_QUESTION(chapter) {
        return `Chapter ${chapter.name} has only ${chapter.questions.length} questions`
    },
}

module.exports = {
    FacultyValidate,
    SemesterValidate,
    CurriculumValidate,
    SubjectValidate,
    ClassValidate,
    ChatroomValidate,
    MessageValidate,
    PrivilegeValidate,
    UserValidate,
    CourseValidate,
    TimelineValidate,
    AnnouncementValidate,
    AssignmentValidate,
    CommentValidate,
    FileValidate,
    ForumValidate,
    TopicValidate,
    ExamValidate,
    QuestionValidate,
    SurveyValidate,
    SurveyResponseValidate,
    QuestionnaireValidate

}