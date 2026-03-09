const roleService = require('../services/roleService');

async function getAllRoles(req, res) {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getRoleById(req, res) {
  try {
    const role = await roleService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createRole(req, res) {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateRole(req, res) {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function softDeleteRole(req, res) {
  try {
    const role = await roleService.softDeleteRole(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ message: 'Role soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  softDeleteRole
};
