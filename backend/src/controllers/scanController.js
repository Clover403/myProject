const { Scan, Vulnerability, Target, AIExplanation } = require("../../models");
const zapService = require("../services/zapService");
const virusTotalService = require("../services/virusTotalService");
const { Op } = require("sequelize");
const { getIO } = require("../config/socket");

// Daily scan limit per user
const DAILY_SCAN_LIMIT = parseInt(process.env.DAILY_SCAN_LIMIT || '5', 10);

class ScanController {
  // Helper: Check daily scan limit
  async checkDailyScanLimit(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scansToday = await Scan.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    return {
      count: scansToday,
      limit: DAILY_SCAN_LIMIT,
      remaining: Math.max(0, DAILY_SCAN_LIMIT - scansToday),
      canScan: scansToday < DAILY_SCAN_LIMIT,
    };
  }

  // GET - Get daily scan usage
  async getDailyScanUsage(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }

      const usage = await this.checkDailyScanLimit(userId);
      return res.json({ usage });
    } catch (error) {
      console.error("Get Daily Scan Usage Error:", error);
      return res.status(500).json({ error: "Failed to fetch scan usage" });
    }
  }

  // CREATE - Start new scan
  async startScan(req, res) {
    try {
      const { url, scanType, targetId, scanMethods } = req.body;
      const userId = req.user?.id;

      console.log('\n========== 📝 STARTING SCAN ==========');
      console.log('📊 Request body:', { url, scanType, targetId, scanMethods });
      console.log('👤 User ID:', userId);
      console.log('👤 Full user object:', req.user);

      // Validate input
      if (!url) {
        console.log('❌ URL is empty');
        return res.status(400).json({ error: "URL is required" });
      }

      if (!userId) {
        console.log('❌ No userId found in request');
        console.log('❌ req.user:', req.user);
        return res.status(401).json({ error: "User authentication required" });
      }

      // Check daily scan limit
      const usageCheck = await this.checkDailyScanLimit(userId);
      if (!usageCheck.canScan) {
        console.log('❌ Daily scan limit reached');
        return res.status(429).json({
          error: `Daily scan limit reached. You have used ${usageCheck.count}/${usageCheck.limit} scans today.`,
          usage: usageCheck,
        });
      }

      // Validate scan methods - default to virustotal only
      const methods = scanMethods || { virustotal: true, owaspzap: false };
      
      // OWASP ZAP is disabled during demo period
      if (methods.owaspzap && !methods.virustotal) {
        console.log('❌ OWASP ZAP only scan not allowed during demo');
        return res.status(400).json({
          error: "OWASP ZAP scanning is currently disabled during demo period. Please select VirusTotal or wait until ZAP is enabled.",
          demoMode: true,
        });
      }

      // If both selected, only use VirusTotal (ZAP disabled)
      const effectiveMethods = {
        virustotal: methods.virustotal || true,
        owaspzap: false, // Always disabled during demo
      };

      // Determine scanner used for record
      let scannerUsed = 'virustotal';
      if (effectiveMethods.owaspzap && effectiveMethods.virustotal) {
        scannerUsed = 'both';
      } else if (effectiveMethods.owaspzap) {
        scannerUsed = 'zap';
      }

      // Create scan record - fix by ensuring all fields are properly set
      const scanData = {
        url: url.trim(),
        scanType: scanType || "quick",
        targetId: targetId ? parseInt(targetId) : null,
        userId: parseInt(userId),
        status: "pending",
        progress: 0,
        scannerUsed: scannerUsed,
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0
      };

      console.log('📝 Scan data to create:', JSON.stringify(scanData, null, 2));

      const scan = await Scan.create(scanData);

      console.log('✅ Scan record created successfully');
      console.log('✅ Scan ID:', scan.id);
      console.log('✅ Scan URL:', scan.url);
      console.log('✅ Scan User ID:', scan.userId);
      console.log('========== SCAN CREATION SUCCESS ==========\n');

      // Start scan asynchronously (VirusTotal only during demo)
      (async () => {
        try {
          console.log(`🔄 Starting async scan process for scan ID ${scan.id}`);
          const startTime = Date.now();

          // Update status to scanning
          console.log(`🔄 Updating scan ${scan.id} status to scanning...`);
          const updateScanFields = (fields) =>
            Scan.update(fields, { where: { id: scan.id } });
          await updateScanFields({ status: "scanning", progress: 10 });

          // Initialize results
          let scanResults = {
            totalVulnerabilities: 0,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            vulnerabilities: [],
          };
          let vtSummary = null;

          // DEMO MODE: Only VirusTotal is enabled
          // ZAP scan is disabled
          console.log(`ℹ️ DEMO MODE: OWASP ZAP scan is disabled`);
          await updateScanFields({ progress: 30 });

          // Run VirusTotal analysis
          console.log(`🧪 Checking VirusTotal reputation for: ${url}`);
          vtSummary = await virusTotalService.scanUrl(url);
          if (vtSummary?.error) {
            console.warn(`⚠️ VirusTotal returned an error: ${vtSummary.error}`);
          } else if (vtSummary) {
            console.log('✅ VirusTotal summary received:', vtSummary);
            
            // Convert VirusTotal results to vulnerability format
            if (vtSummary.maliciousCount > 0) {
              scanResults.criticalCount = vtSummary.maliciousCount;
              scanResults.totalVulnerabilities += vtSummary.maliciousCount;
            }
            if (vtSummary.suspiciousCount > 0) {
              scanResults.mediumCount = vtSummary.suspiciousCount;
              scanResults.totalVulnerabilities += vtSummary.suspiciousCount;
            }
          } else {
            console.log('ℹ️ No VirusTotal summary available for this URL.');
          }
          await updateScanFields({ progress: 75 });

          // Calculate duration
          const duration = Math.floor((Date.now() - startTime) / 1000);

          console.log(`✅ Scan results received:`, {
            vulnerabilities: scanResults.totalVulnerabilities,
            critical: scanResults.criticalCount,
            high: scanResults.highCount,
            medium: scanResults.mediumCount,
            low: scanResults.lowCount,
            duration
          });

          await updateScanFields({ progress: 90 });

          const updatePayload = {
            status: "completed",
            totalVulnerabilities: scanResults.totalVulnerabilities,
            criticalCount: scanResults.criticalCount,
            highCount: scanResults.highCount,
            mediumCount: scanResults.mediumCount,
            lowCount: scanResults.lowCount,
            scanDuration: duration,
            completedAt: new Date(),
            progress: 100,
          };

          if (vtSummary && !vtSummary.error) {
            updatePayload.virustotalVerdict = vtSummary.verdict || null;
            updatePayload.virustotalStats = vtSummary.stats || null;
            updatePayload.virustotalMaliciousCount =
              typeof vtSummary.maliciousCount === "number"
                ? vtSummary.maliciousCount
                : 0;
            updatePayload.virustotalLastAnalysisDate = vtSummary.lastAnalysisDate
              ? new Date(vtSummary.lastAnalysisDate)
              : null;
            updatePayload.virustotalPermalink = vtSummary.permalink || null;
          } else if (vtSummary?.error) {
            updatePayload.virustotalVerdict = "error";
            updatePayload.virustotalStats = { error: vtSummary.error };
            updatePayload.virustotalMaliciousCount = null;
            updatePayload.virustotalLastAnalysisDate = null;
            updatePayload.virustotalPermalink = null;
          }

          // Update scan with results
          console.log(`💾 Updating scan ${scan.id} with results...`);
          const updateResult = await Scan.update(
            updatePayload,
            {
              where: { id: scan.id },
              returning: true
            }
          );

          // Emit socket event for real-time updates
          const io = getIO();
          if (io) {
            io.emit('scan_updated', {
              scanId: scan.id,
              userId: scan.userId,
              status: 'completed',
              progress: 100,
              ...updatePayload
            });
            console.log(`📡 Emitted scan_updated event for scan ${scan.id}`);
          }

          console.log(`✅ Scan ${scan.id} updated. Rows affected:`, updateResult[0]);

          // Save vulnerabilities
          if (scanResults.vulnerabilities && scanResults.vulnerabilities.length > 0) {
            console.log(`💾 Saving ${scanResults.vulnerabilities.length} vulnerabilities...`);
            const vulnerabilitiesToCreate = scanResults.vulnerabilities.map(
              (vuln) => ({
                ...vuln,
                scanId: scan.id,
              })
            );

            const savedVulns = await Vulnerability.bulkCreate(vulnerabilitiesToCreate);
            console.log(`✅ ${savedVulns.length} vulnerabilities saved`);
          }

          console.log(`✅ Scan ${scan.id} completed successfully`);
        } catch (error) {
          console.error(`❌ Async scan failed for ID ${scan.id}:`, error.message);
          try {
            await Scan.update(
              {
                status: "failed",
                errorMessage: error.message,
                progress: 100,
              },
              {
                where: { id: scan.id },
              }
            );
            console.log(`✅ Scan ${scan.id} marked as failed`);
            
            // Emit socket event for failed scan
            const io = getIO();
            if (io) {
              io.emit('scan_updated', {
                scanId: scan.id,
                userId: scan.userId,
                status: 'failed',
                progress: 100,
                errorMessage: error.message
              });
              console.log(`📡 Emitted scan_updated event for failed scan ${scan.id}`);
            }
          } catch (updateError) {
            console.error(`❌ Failed to update scan status:`, updateError.message);
          }
        }
      })();

      return res.status(201).json({
        message: "Scan started successfully",
        scan: {
          id: scan.id,
          url: scan.url,
          status: scan.status,
          scanType: scan.scanType,
          progress: scan.progress,
        },
      });
    } catch (error) {
      console.error("\n========== ❌ START SCAN ERROR ==========");
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
      console.error("SQL Error:", error.sql);
      console.error("Error details:", {
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
      });
      
      // Handle specific Sequelize errors
      if (error.name === 'SequelizeValidationError') {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({
          error: "Validation error",
          details: error.errors.map(e => e.message).join(', ')
        });
      }
      
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        console.error('Foreign Key Constraint Error');
        return res.status(400).json({
          error: "Invalid reference",
          details: `Foreign key constraint error on ${error.table}`
        });
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('Unique Constraint Error');
        return res.status(409).json({
          error: "Duplicate entry",
          details: error.message
        });
      }
      
      console.error("========== END ERROR ==========\n");
      
      return res.status(500).json({ 
        error: "Failed to start scan",
        details: error.message,
        errorName: error.name
      });
    }
  }

  // READ - Get all scans
  async getAllScans(req, res) {
    try {
      const { page = 1, limit = 10, status, targetId } = req.query;
      const userId = req.user?.id;
      const offset = (page - 1) * limit;

      console.log('📊 Fetching scans for user:', userId);

      // Build where clause - only show scans for the current user
      const where = { userId };
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
          {
            model: Vulnerability,
            as: "vulnerabilities",
            attributes: ["id", "severity"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const formattedScans = rows.map((scan) => {
        const plain = scan.toJSON();

        const totalVulnerabilities =
          typeof plain.totalVulnerabilities === "number"
            ? plain.totalVulnerabilities
            : plain.vulnerabilities?.length || 0;

        const severityLevel = (() => {
          if (plain.criticalCount > 0) return "critical";
          if (plain.highCount > 0) return "high";
          if (plain.mediumCount > 0) return "medium";
          if (plain.lowCount > 0) return "low";
          return "none";
        })();

        return {
          ...plain,
          targetUrl: plain.target?.url || plain.url,
          targetName: plain.target?.name || null,
          totalVulnerabilities,
          severityLevel,
          vulnerabilities:
            plain.vulnerabilities?.map((vuln) => ({
              id: vuln.id,
              severity: vuln.severity,
            })) || [],
        };
      });

      return res.json({
        scans: formattedScans,
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
      const userId = req.user?.id;

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

      // Check if scan belongs to current user
      if (scan.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to scan" });
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
      const userId = req.user?.id;

      const scan = await Scan.findByPk(id);

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Check if scan belongs to current user
      if (scan.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to scan" });
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
      const userId = req.user?.id;

      const scan = await Scan.findByPk(id);

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Check if scan belongs to current user
      if (scan.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to scan" });
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
      const userId = req.user?.id;

      console.log('📊 Getting stats for user:', userId);

      // Get all scans for the user
      const scans = await Scan.findAll({
        where: { userId },
        attributes: [
          'id',
          'status',
          'totalVulnerabilities',
          'criticalCount',
          'highCount',
          'mediumCount',
          'lowCount'
        ],
        raw: true
      });

      console.log(`📊 Found ${scans.length} scans`);

      // Calculate statistics from scans
      const completedScans = scans.filter(s => s.status === 'completed');
      const activeScans = scans.filter(s => s.status === 'scanning' || s.status === 'pending');

      const stats = {
        totalScans: scans.length,
        activeScans: activeScans.length,
        completedScans: completedScans.length,
        vulnerabilitiesFound: completedScans.reduce((sum, s) => sum + (s.totalVulnerabilities || 0), 0),
        criticalVulnerabilities: completedScans.reduce((sum, s) => sum + (s.criticalCount || 0), 0),
        highVulnerabilities: completedScans.reduce((sum, s) => sum + (s.highCount || 0), 0),
        mediumVulnerabilities: completedScans.reduce((sum, s) => sum + (s.mediumCount || 0), 0),
        lowVulnerabilities: completedScans.reduce((sum, s) => sum + (s.lowCount || 0), 0),
      };

      console.log('📊 Stats calculated:', stats);

      return res.json({ stats });
    } catch (error) {
      console.error("❌ Get Stats Error:", error);
      return res.status(500).json({ error: "Failed to fetch statistics" });
    }
  }

  // Get scan status (for polling)
  async getScanStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const scan = await Scan.findByPk(id, {
        attributes: [
          "id",
          "userId",
          "status",
          "progress",
          "totalVulnerabilities",
          "completedAt",
          "errorMessage",
        ],
      });

      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Check if scan belongs to current user
      if (scan.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized access to scan" });
      }

      return res.json({ scan });
    } catch (error) {
      console.error("Get Scan Status Error:", error);
      return res.status(500).json({ error: "Failed to fetch scan status" });
    }
  }
}

const scanController = new ScanController();
module.exports = scanController;
