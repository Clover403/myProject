const axios = require('axios');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ZapService {
  constructor() {
    this.baseUrl = process.env.ZAP_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.ZAP_API_KEY || '';
    this.spiderPollMs = parseInt(process.env.ZAP_SPIDER_POLL_MS || '2000', 10);
    this.activePollMs = parseInt(process.env.ZAP_ACTIVE_POLL_MS || '5000', 10);
    this.maxSpiderChecks = parseInt(process.env.ZAP_SPIDER_MAX_POLLS || '90', 10); // ~3 minutes default
    this.maxActiveChecks = parseInt(process.env.ZAP_ACTIVE_MAX_POLLS || '240', 10); // ~20 minutes default
  }

  // Start spider scan
  async startSpider(url) {
    try {
      const response = await axios.get(`${this.baseUrl}/JSON/spider/action/scan/`, {
        params: {
          apikey: this.apiKey,
          url: url,
          maxChildren: 10,
          recurse: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('ZAP Spider Error:', error.message);
      throw new Error('Failed to start spider scan');
    }
  }

  // Get spider status
  async getSpiderStatus(scanId) {
    try {
      const response = await axios.get(`${this.baseUrl}/JSON/spider/view/status/`, {
        params: {
          apikey: this.apiKey,
          scanId: scanId
        }
      });
      return parseInt(response.data.status);
    } catch (error) {
      console.error('ZAP Spider Status Error:', error.message);
      throw new Error('Failed to get spider status');
    }
  }

  // Start active scan
  async startActiveScan(url) {
    try {
      const response = await axios.get(`${this.baseUrl}/JSON/ascan/action/scan/`, {
        params: {
          apikey: this.apiKey,
          url: url,
          recurse: true,
          inScopeOnly: false
        }
      });
      return response.data;
    } catch (error) {
      console.error('ZAP Active Scan Error:', error.message);
      throw new Error('Failed to start active scan');
    }
  }

  // Get active scan status
  async getActiveScanStatus(scanId) {
    try {
      const response = await axios.get(`${this.baseUrl}/JSON/ascan/view/status/`, {
        params: {
          apikey: this.apiKey,
          scanId: scanId
        }
      });
      return parseInt(response.data.status);
    } catch (error) {
      console.error('ZAP Active Scan Status Error:', error.message);
      throw new Error('Failed to get active scan status');
    }
  }

  // Get alerts (vulnerabilities)
  async getAlerts(baseUrl) {
    try {
      const response = await axios.get(`${this.baseUrl}/JSON/core/view/alerts/`, {
        params: {
          apikey: this.apiKey,
          baseurl: baseUrl
        }
      });
      return response.data.alerts || [];
    } catch (error) {
      console.error('ZAP Get Alerts Error:', error.message);
      throw new Error('Failed to get alerts');
    }
  }

  // Parse ZAP alerts to our vulnerability format
  parseAlerts(alerts = []) {
    const severityMap = {
      '3': 'critical',
      'high': 'high',
      '2': 'high',
      'medium': 'medium',
      '1': 'medium',
      'low': 'low',
      '0': 'low',
      'informational': 'low'
    };

    return alerts.map((alert) => {
      const severityKey = (alert.riskcode || alert.risk || '').toString().toLowerCase();
      return {
        vulnType: alert.alert || alert.name,
        severity: severityMap[severityKey] || 'low',
        confidence: alert.confidence,
        location: alert.url,
        method: alert.method || 'GET',
        parameter: alert.param || alert.attack || '',
        description: alert.description || alert.desc,
        evidence: alert.evidence || '',
        solution: alert.solution || '',
        cweId: parseInt(alert.cweid, 10) || null,
        cvssScore: null // ZAP doesn't provide CVSS by default
      };
    });
  }

  extractBaseUrl(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch (error) {
      return targetUrl;
    }
  }

  async accessUrl(url) {
    try {
      await axios.get(`${this.baseUrl}/JSON/core/action/accessUrl/`, {
        params: {
          apikey: this.apiKey,
          url,
          followRedirects: true
        },
        timeout: 5000
      });
    } catch (error) {
      // Not fatal, log for visibility only when debugging
      console.warn('ZAP accessUrl warning:', error.message);
    }
  }

  async collectAlerts(baseUrl) {
    const alerts = [];
    let start = 0;
    const pageSize = 200;

    while (true) {
      const response = await axios.get(`${this.baseUrl}/JSON/core/view/alerts/`, {
        params: {
          apikey: this.apiKey,
          baseurl: baseUrl,
          start,
          count: pageSize
        }
      });

      const page = response.data.alerts || [];
      alerts.push(...page);

      if (page.length < pageSize) {
        break;
      }

      start += pageSize;
    }

    return alerts;
  }

  async startNewSession() {
    try {
      await axios.get(`${this.baseUrl}/JSON/core/action/newSession/`, {
        params: {
          apikey: this.apiKey,
          name: `scan-${Date.now()}`,
          overwrite: true
        },
        timeout: 5000
      });
    } catch (error) {
      console.warn('ZAP newSession warning:', error.message);
    }
  }

  // Full scan workflow - production
  async performFullScan(url) {
    try {
      const targetUrl = url.trim();
      if (!targetUrl) {
        throw new Error('Target URL is required');
      }

      console.log(`🔍 Starting full scan for ${targetUrl}`);

      // Check if ZAP is available
      const zapAvailable = await this.checkZapAvailability();
      
      if (!zapAvailable) {
        throw new Error('OWASP ZAP API is unreachable. Start ZAP in daemon mode and try again.');
      }
      
      const baseUrl = this.extractBaseUrl(targetUrl);
  await this.startNewSession();
      await this.accessUrl(targetUrl);

      console.log('Step 1: Starting spider...');
      const spiderResult = await this.startSpider(targetUrl);
      const spiderId = spiderResult.scan;
      
      // Wait for spider to complete with timeout protection
      let spiderProgress = 0;
      let spiderChecks = 0;
      while (spiderProgress < 100) {
        if (spiderChecks >= this.maxSpiderChecks) {
          throw new Error('Spider scan timed out');
        }

        await delay(this.spiderPollMs);
        spiderProgress = await this.getSpiderStatus(spiderId);
        console.log(`Spider progress: ${spiderProgress}%`);
        spiderChecks += 1;
      }
      
      // Step 2: Active Scan
      console.log('Step 2: Starting active scan...');
      const scanResult = await this.startActiveScan(targetUrl);
      const scanId = scanResult.scan;
      
      // Wait for active scan to complete with timeout protection
      let scanProgress = 0;
      let scanChecks = 0;
      while (scanProgress < 100) {
        if (scanChecks >= this.maxActiveChecks) {
          throw new Error('Active scan timed out');
        }

        await delay(this.activePollMs);
        scanProgress = await this.getActiveScanStatus(scanId);
        console.log(`Active scan progress: ${scanProgress}%`);
        scanChecks += 1;
      }
      
      // Step 3: Get alerts
      console.log('Step 3: Retrieving alerts...');
      const alerts = await this.collectAlerts(baseUrl);
      
      // Parse alerts
      const vulnerabilities = this.parseAlerts(alerts);
      
      console.log(`✅ Scan completed. Found ${vulnerabilities.length} vulnerabilities`);
      
      return {
        success: true,
        vulnerabilities,
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
        highCount: vulnerabilities.filter(v => v.severity === 'high').length,
        mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
        lowCount: vulnerabilities.filter(v => v.severity === 'low').length
      };
      
    } catch (error) {
      console.error('❌ Full Scan Error:', error.message);
      throw new Error(`ZAP scan failed: ${error.message}`);
    }
  }

  // Check if ZAP is available
  async checkZapAvailability() {
    try {
      await axios.get(`${this.baseUrl}/JSON/core/view/version/`, {
        timeout: 3000,
        params: this.apiKey
          ? { apikey: this.apiKey }
          : {}
      });
      console.log('✅ ZAP API is available');
      return true;
    } catch (error) {
      console.log('⚠️ ZAP API is not available:', error.message);
      return false;
    }
  }
  // generateMockResults intentionally removed to enforce real scanning
}

module.exports = new ZapService();