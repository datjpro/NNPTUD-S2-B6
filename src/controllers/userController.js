const userService = require('../services/userService');

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const plainUser = user.toObject ? user.toObject() : { ...user };
  delete plainUser.password;
  return plainUser;
}

async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function softDeleteUser(req, res) {
  try {
    const user = await userService.softDeleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function enableUser(req, res) {
  const { email, username } = req.body;

  try {
    const user = await userService.setUserStatusByEmailAndUsername(email, username, true);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function disableUser(req, res) {
  const { email, username } = req.body;

  try {
    const user = await userService.setUserStatusByEmailAndUsername(email, username, false);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function checkLogin(req, res) {
  const { identifier, email, username, password } = req.body;
  const loginIdentifier = identifier || email || username;

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  try {
    const session = await userService.checkLogin(loginIdentifier, password);

    if (!session) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      session: {
        token: session.token,
        tokenType: session.tokenType,
        expiresIn: session.expiresIn,
        user: sanitizeUser(session.user)
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function getCurrentProfile(req, res) {
  try {
    const user = await userService.getCurrentUser(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'oldPassword and newPassword are required' });
  }

  try {
    await userService.changePassword(req.user.sub, oldPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  softDeleteUser,
  enableUser,
  disableUser,
  checkLogin,
  getCurrentProfile,
  changePassword
};
