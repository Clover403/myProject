const axios = require('axios');

class ZapService {
  constructor() {
    this.baseUrl = process.env.ZAP_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.ZAP_API_KEY || '';
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
  parseAlerts(alerts) {
    return alerts.map(alert => {
      // Map ZAP risk to severity
      const severityMap = {
        '3': 'critical',
        '2': 'high',
        '1': 'medium',
        '0': 'low'
      };

      return {
        vulnType: alert.alert || alert.name,
        severity: severityMap[alert.risk] || 'low',
        confidence: alert.confidence,
        location: alert.url,
        method: alert.method || 'GET',
        parameter: alert.param || alert.attack || '',
        description: alert.description || alert.desc,
        evidence: alert.evidence || '',
        solution: alert.solution || '',
        cweId: parseInt(alert.cweid) || null,
        cvssScore: null // ZAP doesn't provide CVSS by default
      };
    });
  }

  // Full scan workflow
  async performFullScan(url) {
    try {
      console.log(`Starting full scan for ${url}`);
      
      // Step 1: Spider
      console.log('Step 1: Starting spider...');
      const spiderResult = await this.startSpider(url);
      const spiderId = spiderResult.scan;
      
      // Wait for spider to complete
      let spiderProgress = 0;
      while (spiderProgress < 100) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        spiderProgress = await this.getSpiderStatus(spiderId);
        console.log(`Spider progress: ${spiderProgress}%`);
      }
      
      // Step 2: Active Scan
      console.log('Step 2: Starting active scan...');
      const scanResult = await this.startActiveScan(url);
      const scanId = scanResult.scan;
      
      // Wait for active scan to complete
      let scanProgress = 0;
      while (scanProgress < 100) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        scanProgress = await this.getActiveScanStatus(scanId);
        console.log(`Active scan progress: ${scanProgress}%`);
      }
      
      // Step 3: Get alerts
      console.log('Step 3: Retrieving alerts...');
      const alerts = await this.getAlerts(url);
      
      // Parse alerts
      const vulnerabilities = this.parseAlerts(alerts);
      
      console.log(`Scan completed. Found ${vulnerabilities.length} vulnerabilities`);
      
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
      console.error('Full Scan Error:', error);
      throw error;
    }
  }
}

module.exports = new ZapService();