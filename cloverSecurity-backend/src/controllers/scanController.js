const { Scan, Vulnerability, Target, AIExplanation } = require("../../models");
const zapService = require("../services/zapService");
const { Op } = require("sequelize");

class ScanController {
  // CREATE - Start new scan
  async startScan(req, res) {
    try {
      const { url, scanType, targetId } = req.body;
      const userId = req.user?.id;

      // Validate input
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Create scan record
      const scan = await Scan.create({
        url,
        scanType: scanType || "quick",
        targetId: targetId || null,
        userId,
        status: "pending",
        scannerUsed: "zap",
      });

      // Start scan asynchronously
      this.performScan(scan.id, url).catch((error) => {
        console.error("Scan failed:", error);
      });

      return res.status(201).json({
        message: "Scan started successfully",
        scan: {
          id: scan.id,
          url: scan.url,
          status: scan.status,
          scanType: scan.scanType,
        },
      });
    } catch (error) {
      console.error("Start Scan Error:", error);
      console.error("Error Stack:", error.stack);
      console.error("Error Details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        detail: error.detail,
        originalError: error.originalError?.message
      });
      return res.status(500).json({ error: "Failed to start scan" });
    }
  }

  // Background scan process
  async performScan(scanId, url) {
    const startTime = Date.now();

    try {
      // Update status to scanning
      await Scan.update({ status: "scanning" }, { where: { id: scanId } });

      // Perform ZAP scan
      const scanResults = await zapService.performFullScan(url);

      // Calculate duration
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update scan with results
      await Scan.update(
        {
          status: "completed",
          totalVulnerabilities: scanResults.totalVulnerabilities,
          criticalCount: scanResults.criticalCount,
          highCount: scanResults.highCount,
          mediumCount: scanResults.mediumCount,
          lowCount: scanResults.lowCount,
          scanDuration: duration,
          completedAt: new Date(),
        },
        {
          where: { id: scanId },
        }
      );

      // Save vulnerabilities
      if (scanResults.vulnerabilities.length > 0) {
        const vulnerabilitiesToCreate = scanResults.vulnerabilities.map(
          (vuln) => ({
            ...vuln,
            scanId,
          })
        );

        await Vulnerability.bulkCreate(vulnerabilitiesToCreate);
      }

      console.log(`Scan ${scanId} completed successfully`);
    } catch (error) {
      console.error(`Scan ${scanId} failed:`, error);

      await Scan.update(
        {
          status: "failed",
          errorMessage: error.message,
        },
        {
          where: { id: scanId },
        }
      );
    }
  }

  // READ - Get all scans
  async getAllScans(req, res) {
    try {
      const { page = 1, limit = 10, status, targetId } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause
      const where = {};
      if (status) where.status = status;
      if (targetId) where.targetId = targetId;

      const { count, rows } = await Scan.findAndCountAll({
        where,
        include: [
          {
            model: Target,
            as: "target",
            attributes: ["id", "name", "url"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return res.json({
        scans: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Get All Scans Error:", error);
      return res.status(500).json({ error: "Failed to fetch scans" });
    }
  }

  // READ - Get scan by ID with vulnerabilities
  async getScanById(req, res) {
    try {
      const { id } = req.params;

      const scan = await Scan.findByPk(id, {
        include: [
          {
            model: Target,
            as: "target",
            attributes: ["id", "name", "url"],
          },
          {
            model: Vulnerability,
            as: "vulnerabilities",
            include: [
              {
                model: AIExplanation,
                as: "aiExplanation",
                required: false,
              },
            ],
            order: [
              ["severity", "ASC"], // Will sort: critical, high, medium, low
            ],
          },
        ],
      });

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      return res.json({ scan });
    } catch (error) {
      console.error("Get Scan By ID Error:", error);
      return res.status(500).json({ error: "Failed to fetch scan" });
    }
  }

  // UPDATE - Update scan notes
  async updateNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const scan = await Scan.findByPk(id);

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      await scan.update({ notes });

      return res.json({
        message: "Notes updated successfully",
        scan,
      });
    } catch (error) {
      console.error("Update Notes Error:", error);
      return res.status(500).json({ error: "Failed to update notes" });
    }
  }

  // DELETE - Delete scan
  async deleteScan(req, res) {
    try {
      const { id } = req.params;

      const scan = await Scan.findByPk(id);

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      await scan.destroy();

      return res.json({
        message: "Scan deleted successfully",
        deletedScanId: id,
      });
    } catch (error) {
      console.error("Delete Scan Error:", error);
      return res.status(500).json({ error: "Failed to delete scan" });
    }
  }

  // Get scan statistics
  async getStats(req, res) {
    try {
      const stats = await Scan.findOne({
        attributes: [
          [Scan.sequelize.fn("COUNT", Scan.sequelize.col("id")), "totalScans"],
          [
            Scan.sequelize.fn(
              "SUM",
              Scan.sequelize.col("totalVulnerabilities")
            ),
            "totalVulnerabilities",
          ],
          [
            Scan.sequelize.fn("SUM", Scan.sequelize.col("criticalCount")),
            "totalCritical",
          ],
          [
            Scan.sequelize.fn("SUM", Scan.sequelize.col("highCount")),
            "totalHigh",
          ],
          [
            Scan.sequelize.fn("SUM", Scan.sequelize.col("mediumCount")),
            "totalMedium",
          ],
          [
            Scan.sequelize.fn("SUM", Scan.sequelize.col("lowCount")),
            "totalLow",
          ],
        ],
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
          status: "completed",
        },
        raw: true,
      });

      return res.json({ stats });
    } catch (error) {
      console.error("Get Stats Error:", error);
      return res.status(500).json({ error: "Failed to fetch statistics" });
    }
  }

  // Get scan status (for polling)
  async getScanStatus(req, res) {
    try {
      const { id } = req.params;

      const scan = await Scan.findByPk(id, {
        attributes: [
          "id",
          "status",
          "totalVulnerabilities",
          "completedAt",
          "errorMessage",
        ],
      });

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      return res.json({ scan });
    } catch (error) {
      console.error("Get Scan Status Error:", error);
      return res.status(500).json({ error: "Failed to fetch scan status" });
    }
  }
}

module.exports = new ScanController();
