const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

async function getAllUsers() {
  return User.find({ isDeleted: false }).populate('role');
}

async function getUserById(id) {
  return User.findOne({ _id: id, isDeleted: false }).populate('role');
}

async function createUser(payload) {
  const user = new User(payload);
  return user.save();
}

async function updateUser(id, payload) {
  const updatedPayload = { ...payload };

  if (updatedPayload.password) {
    updatedPayload.password = await bcrypt.hash(updatedPayload.password, 10);
  }

  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updatedPayload,
    { new: true }
  ).populate('role');
}

async function softDeleteUser(id) {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
}

async function setUserStatusByEmailAndUsername(email, username, status) {
  const user = await User.findOne({ email, username, isDeleted: false }).populate('role');
  if (!user) {
    return null;
  }

  user.status = status;
  await user.save();
  return user;
}

async function checkLogin(identifier, password) {
  const user = await User.findOne({
    isDeleted: false,
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).populate('role');

  if (!user) {
    return null;
  }

  if (!user.status) {
    const error = new Error('User account is disabled');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return null;
  }

  user.loginCount += 1;
  await user.save();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role ? user.role.name : null
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: JWT_EXPIRES_IN,
    user
  };
}

async function getCurrentUser(userId) {
  return User.findOne({ _id: userId, isDeleted: false }).populate('role');
}

async function changePassword(userId, oldPassword, newPassword) {
  const user = await User.findOne({ _id: userId, isDeleted: false }).populate('role');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isOldPasswordValid = await user.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    const error = new Error('Old password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return user;
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  softDeleteUser,
  setUserStatusByEmailAndUsername,
  checkLogin,
  getCurrentUser,
  changePassword
};
