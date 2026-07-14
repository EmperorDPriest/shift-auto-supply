export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success    = statusCode < 400;
    this.message    = message;
    this.data       = data;
  }

  static success(res, data, message = 'Success', code = 200) {
    return res.status(code).json(new ApiResponse(code, data, message));
  }

  static created(res, data, message = 'Created') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
