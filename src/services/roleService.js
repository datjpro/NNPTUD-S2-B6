const Role = require('../../models/Role');

async function getAllRoles() {
  return Role.find({ deletedAt: null });
}

async function getRoleById(id) {
  return Role.findOne({ _id: id, deletedAt: null });
}

async function createRole(payload) {
  const role = new Role(payload);
  return role.save();
}

async function updateRole(id, payload) {
  return Role.findOneAndUpdate(
    { _id: id, deletedAt: null },
    payload,
    { new: true }
  );
}

async function softDeleteRole(id) {
  return Role.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
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
