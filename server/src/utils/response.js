function sendSuccess(res, data, statusCode = 200, message = null) {
  const payload = {
    success: true,
    data
  };
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
}

function sendError(res, message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };
  if (details) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendError
};
