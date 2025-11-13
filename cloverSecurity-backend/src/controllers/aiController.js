const { Vulnerability, AIExplanation } = require('../../models');
const geminiService = require('../services/geminiService');

class AIController {
  // Generate AI explanation for vulnerability
  async explainVulnerability(req, res) {
    try {
      const { vulnerabilityId } = req.params;

      // Find vulnerability
      const vulnerability = await Vulnerability.findByPk(vulnerabilityId);

      if (!vulnerability) {
        return res.status(404).json({ error: 'Vulnerability not found' });
      }

      // Check if explanation already exists (cached)
      let explanation = await AIExplanation.findOne({
        where: { vulnerabilityId }
      });

      if (explanation) {
        return res.json({
          message: 'Explanation retrieved from cache',
          explanation,
          cached: true
        });
      }

      // Generate new explanation
      const aiResponse = await geminiService.explainVulnerability(vulnerability);

      // Save explanation
      explanation = await AIExplanation.create({
        vulnerabilityId,
        explanation: aiResponse.explanation,
        fixRecommendation: aiResponse.fixRecommendation,
        additionalResources: aiResponse.additionalResources,
        aiModel: aiResponse.aiModel,
        tokensUsed: aiResponse.tokensUsed
      });

      return res.status(201).json({
        message: 'Explanation generated successfully',
        explanation,
        cached: false
      });

    } catch (error) {
      console.error('Explain Vulnerability Error:', error);
      return res.status(500).json({ error: 'Failed to generate explanation' });
    }
  }

  // Generate security advice for scan
  async getSecurityAdvice(req, res) {
    try {
      const { scanId } = req.params;

      // Get scan with vulnerabilities
      const { Scan } = require('../../models');
      const scan = await Scan.findByPk(scanId, {
        include: [
          {
            model: Vulnerability,
            as: 'vulnerabilities',
            limit: 5,
            order: [
              ['severity', 'ASC'],
              ['cvssScore', 'DESC']
            ]
          }
        ]
      });

      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      // Prepare scan results for AI
      const scanResults = {
        totalVulnerabilities: scan.totalVulnerabilities,
        criticalCount: scan.criticalCount,
        highCount: scan.highCount,
        mediumCount: scan.mediumCount,
        lowCount: scan.lowCount,
        topVulns: scan.vulnerabilities.map(v => ({
          vulnType: v.vulnType,
          severity: v.severity
        }))
      };

      // Generate advice
      const advice = await geminiService.getSecurityAdvice(scanResults);

      return res.json({
        message: 'Security advice generated successfully',
        advice,
        scanId
      });

    } catch (error) {
      console.error('Get Security Advice Error:', error);
      return res.status(500).json({ error: 'Failed to generate security advice' });
    }
  }

  // Chat with AI about security (custom query)
  async chatWithAI(req, res) {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Build context-aware prompt
      let prompt = question;
      if (context) {
        prompt = `Context: ${JSON.stringify(context)}\n\nQuestion: ${question}`;
      }

      const { model } = geminiService;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      return res.json({
        question,
        answer
      });

    } catch (error) {
      console.error('Chat with AI Error:', error);
      return res.status(500).json({ error: 'Failed to process AI request' });
    }
  }
}

module.exports = new AIController();