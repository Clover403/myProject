const { Vulnerability, AIExplanation } = require('../../models');
const aiService = require('../services/aiService');

function buildUserSettings(req) {
  const bodySettings = req.body?.settings || {};
  const directBody = req.body || {};
  const query = req.query || {};

  return {
    provider: bodySettings.provider || directBody.provider || query.provider,
    model: bodySettings.model || directBody.model || query.model,
    temperature:
      bodySettings.temperature ?? directBody.temperature ?? query.temperature,
    maxTokens:
      bodySettings.maxTokens ?? directBody.maxTokens ?? query.maxTokens,
  };
}

class AIController {
  // Generate AI explanation for vulnerability
  async explainVulnerability(req, res) {
    try {
      const { vulnerabilityId } = req.params;

      // Find vulnerability
      const vulnerability = await Vulnerability.findByPk(vulnerabilityId, {
        include: ['scan'],
      });

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
          cached: true,
          usage: null,
        });
      }

      // Generate new explanation
      const userSettings = buildUserSettings(req);
      const aiResponse = await aiService.explainVulnerability({
        vulnerability,
        settings: userSettings,
      });

      const usage = aiResponse.usage || {
        provider: 'unknown',
        model: 'unknown',
        tokens: { total: 0 },
      };

      const combinedExplanation = [
        aiResponse.explanation && `Simple Explanation:\n${aiResponse.explanation}`,
        aiResponse.impact && `Potential Impact:\n${aiResponse.impact}`,
      ]
        .filter(Boolean)
        .join('\n\n')
        .trim();

      // Save explanation
      explanation = await AIExplanation.create({
        vulnerabilityId,
        explanation: combinedExplanation || aiResponse.raw,
        fixRecommendation: aiResponse.remediation || '',
        additionalResources: aiResponse.additionalResources || [],
        aiModel: `${usage.provider}:${usage.model}`,
        tokensUsed: usage.tokens?.total || 0,
      });

      return res.status(201).json({
        message: 'Explanation generated successfully',
        explanation,
        cached: false,
        usage: usage,
      });

    } catch (error) {
      console.error('Explain Vulnerability Error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        error:
          status === 503
            ? 'AI provider unavailable - please check configuration'
            : 'Failed to generate explanation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
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

      const userSettings = buildUserSettings(req);
      const result = await aiService.getSecurityAdvice({
        scanSummary: scanResults,
        settings: userSettings,
      });

      return res.json({
        message: 'Security advice generated successfully',
        advice: result.message.content,
        usage: result.usage,
        scanId,
      });

    } catch (error) {
      console.error('Get Security Advice Error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        error: 'Failed to generate security advice',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // Chat with AI about security (custom query)
  async chatWithAI(req, res) {
    try {
      const { messages, context } = req.body || {};

      if (!Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ error: 'Messages array with at least one item is required' });
      }

      const userSettings = buildUserSettings(req);
      const aiResponse = await aiService.chat({
        messages,
        context,
        settings: userSettings,
      });

      return res.json({
        message: aiResponse.message,
        usage: aiResponse.usage,
        context: aiResponse.context,
      });

    } catch (error) {
      console.error('Chat with AI Error:', error);
      const status = error.statusCode || 500;
  const provider = error.aiProvider;
  const model = error.aiModel;
  const normalizedModel = typeof model === 'string' ? model.replace(/^models\//, '') : model;
      const rawMessage = error.message || '';

      let clientMessage;
      let hint;

      if (status === 429) {
        clientMessage = 'AI provider rate limit reached. Please wait a moment before retrying.';
      } else if (status === 401 || status === 403) {
        clientMessage = 'AI provider rejected the credentials. Verify the server API key and permissions.';
      } else if (status === 502 && provider === 'gemini' && rawMessage.includes('not found')) {
        clientMessage = 'Gemini could not find the configured model. Update GEMINI_MODEL or pick a supported model in Assistant Settings.';
        hint = 'Example: models/gemini-1.5-flash-latest';
      } else if (status === 503) {
        clientMessage = 'AI provider unavailable - please check configuration';
      } else if (status === 502) {
        clientMessage = 'AI provider is unreachable. Confirm network access and model availability.';
      }

      if (!clientMessage) {
        clientMessage = 'Failed to process AI request';
      }

      return res.status(status).json({
        error: clientMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        meta: {
          provider,
          model: normalizedModel,
          status,
          hint,
        },
      });
    }
  }

  async getMeta(req, res) {
    const meta = aiService.getMeta();
    return res.json(meta);
  }
}

module.exports = new AIController();