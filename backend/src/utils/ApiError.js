//src/utils/ApiError.js
export default class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
  static badRequest(msg) { return new ApiError(400, msg); }
  static forbidden(msg) { return new ApiError(403, msg); }
  }