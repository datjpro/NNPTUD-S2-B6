const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  fullName: {
    type: String,
    default: ""
  },
  avatarUrl: {
    type: String,
    default: "https://i.sstatic.net/l60Hf.png"
  },
  status: {
    type: Boolean,
    default: false
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  loginCount: {
    type: Number,
    default: 0,
    min: [0, "Login count cannot be negative"]
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  forgotPasswordToken: {
    type: String
  },
  forgotPasswordTokenExp: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function saveUser(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
