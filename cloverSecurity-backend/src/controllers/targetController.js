const { Target, Scan } = require('../../models');

class TargetController {
  // CREATE - Add new target
  async createTarget(req, res) {
    try {
      const { url, name, description, tags } = req.body;

      // Validate input
      if (!url || !name) {
        return res.status(400).json({ error: 'URL and name are required' });
      }

      // Basic URL validation
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'URL must start with http:// or https://' });
      }

      // Check if target already exists
      const existingTarget = await Target.findOne({ where: { url } });
      if (existingTarget) {
        return res.status(409).json({ error: 'Target with this URL already exists' });
      }

      const target = await Target.create({
        url,
        name,
        description: description || null,
        tags: tags || []
      });

      return res.status(201).json({
        message: 'Target created successfully',
        target
      });

    } catch (error) {
      console.error('Create Target Error:', error);
      
      // Better error messages
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ error: `Validation error: ${messages}` });
      }
      
      return res.status(500).json({ error: error.message || 'Failed to create target' });
    }
  }

  // READ - Get all targets
  async getAllTargets(req, res) {
    try {
      const targets = await Target.findAll({
        include: [
          {
            model: Scan,
            as: 'scans',
            attributes: ['id', 'createdAt', 'status'],
            limit: 1,
            order: [['createdAt', 'DESC']],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Format response with scan count
      const formattedTargets = await Promise.all(
        targets.map(async (target) => {
          const scanCount = await Scan.count({
            where: { targetId: target.id }
          });

          return {
            ...target.toJSON(),
            scanCount,
            lastScan: target.scans[0] || null
          };
        })
      );

      return res.json({ targets: formattedTargets });

    } catch (error) {
      console.error('Get All Targets Error:', error);
      return res.status(500).json({ error: 'Failed to fetch targets' });
    }
  }

  // READ - Get target by ID
  async getTargetById(req, res) {
    try {
      const { id } = req.params;

      const target = await Target.findByPk(id, {
        include: [
          {
            model: Scan,
            as: 'scans',
            order: [['createdAt', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      return res.json({ target });

    } catch (error) {
      console.error('Get Target By ID Error:', error);
      return res.status(500).json({ error: 'Failed to fetch target' });
    }
  }

  // UPDATE - Update target
  async updateTarget(req, res) {
    try {
      const { id } = req.params;
      const { name, description, tags, isActive } = req.body;

      const target = await Target.findByPk(id);

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      await target.update({
        name: name || target.name,
        description: description !== undefined ? description : target.description,
        tags: tags || target.tags,
        isActive: isActive !== undefined ? isActive : target.isActive
      });

      return res.json({
        message: 'Target updated successfully',
        target
      });

    } catch (error) {
      console.error('Update Target Error:', error);
      return res.status(500).json({ error: 'Failed to update target' });
    }
  }

  // DELETE - Delete target
  async deleteTarget(req, res) {
    try {
      const { id } = req.params;

      const target = await Target.findByPk(id);

      if (!target) {
        return res.status(404).json({ error: 'Target not found' });
      }

      // Check if target has scans
      const scanCount = await Scan.count({ where: { targetId: id } });

      await target.destroy();

      return res.json({
        message: 'Target deleted successfully',
        deletedTargetId: id,
        affectedScans: scanCount
      });

    } catch (error) {
      console.error('Delete Target Error:', error);
      return res.status(500).json({ error: 'Failed to delete target' });
    }
  }
}

module.exports = new TargetController();