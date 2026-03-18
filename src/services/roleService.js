const Role = require('../../models/Role');

async function getAllRoles() {
  return Role.find({ isDeleted: false });
}

async function getRoleById(id) {
  return Role.findOne({ _id: id, isDeleted: false });
}

async function createRole(payload) {
  const role = new Role(payload);
  return role.save();
}

async function updateRole(id, payload) {
  return Role.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true }
  );
}

async function softDeleteRole(id) {
  return Role.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  softDeleteRole
};
