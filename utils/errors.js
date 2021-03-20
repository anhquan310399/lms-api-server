const responseCodes = require('../constants/httpResponseCodes.js');

class HttpError extends Error {
    constructor({ message, name, status, stack }) {
      super(message);
      this.name = name;
      this.status = status;
      this.stack = stack;
      Error.captureStackTrace(this, HttpError);
    }
  }
  
  class HttpBadRequest extends HttpError {
    constructor(message = 'Bad request', stack) {
      super({
        message,
        name: "HttpBadRequest",
        status: responseCodes.BAD_REQUEST,
        stack
      });
    }
  }
  
  class HttpNotFound extends HttpError {
    constructor(message = 'Not Found', stack) {
      super({
        message,
        name: "HttpNotFound",
        status: responseCodes.NOT_FOUND,
        stack
      });
    }
  }
  
  class HttpInternalServerError extends HttpError {
    constructor(message = 'Internal server error', stack) {
      super({
        message,
        name: "HttpInternalServerError",
        status: responseCodes.INTERNAL_SERVER_ERROR,
        stack
      });
    }
  }

  class HttpUnauthorized extends HttpError {
    constructor(message = 'Unauthorized to access this resource', stack) {
      super({
        message,
        name: "HttpUnauthorized",
        status: responseCodes.UNAUTHORIZED,
        stack
      });
    }
  }
  
  module.exports = {
    HttpError,
    HttpBadRequest,
    HttpNotFound,
    HttpInternalServerError,
    HttpUnauthorized
  }