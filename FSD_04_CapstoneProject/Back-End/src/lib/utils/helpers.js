const generateToken = (payload, expiresIn = "7d") => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const hashPassword = async (password) => {
  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const formatResponse = (success, message, data = null) => {
  return {
    success,
    message,
    ...(data && { data }),
  };
};

const calculatePagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  return { pageNum, limitNum, skip };
};

module.exports = {
  generateToken,
  hashPassword,
  formatResponse,
  calculatePagination,
};
