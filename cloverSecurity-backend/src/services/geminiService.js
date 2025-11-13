const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Generate explanation for vulnerability
  async explainVulnerability(vulnerability) {
    try {
      const prompt = `
You are a cybersecurity expert. Explain the following security vulnerability in a clear and understandable way.

Vulnerability Details:
- Type: ${vulnerability.vulnType}
- Severity: ${vulnerability.severity}
- Location: ${vulnerability.location}
- Description: ${vulnerability.description}

Please provide:
1. **Simple Explanation**: Explain what this vulnerability is in simple terms (2-3 sentences)
2. **Potential Impact**: What could an attacker do if they exploit this? (3-4 bullet points)
3. **How to Fix**: Step-by-step recommendations to fix this vulnerability (numbered list)
4. **Additional Resources**: Suggest 2-3 relevant learning resources or documentation links

Format your response in a structured way with clear sections.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract sections from response
      const sections = this.parseAIResponse(text);

      return {
        explanation: sections.explanation || text,
        fixRecommendation: sections.fix || '',
        additionalResources: sections.resources || [],
        aiModel: 'gemini-pro',
        tokensUsed: this.estimateTokens(prompt + text)
      };

    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw new Error('Failed to generate AI explanation');
    }
  }

  // Parse AI response into sections
  parseAIResponse(text) {
    const sections = {
      explanation: '',
      fix: '',
      resources: []
    };

    // Simple parsing logic
    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const lower = line.toLowerCase();
      
      if (lower.includes('simple explanation') || lower.includes('what is')) {
        currentSection = 'explanation';
        continue;
      } else if (lower.includes('how to fix') || lower.includes('recommendation')) {
        currentSection = 'fix';
        continue;
      } else if (lower.includes('resources') || lower.includes('learn more')) {
        currentSection = 'resources';
        continue;
      }

      if (currentSection === 'explanation') {
        sections.explanation += line + '\n';
      } else if (currentSection === 'fix') {
        sections.fix += line + '\n';
      } else if (currentSection === 'resources' && line.trim()) {
        sections.resources.push(line.trim());
      }
    }

    return sections;
  }

  // Estimate tokens (rough approximation)
  estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  // Generate custom security advice
  async getSecurityAdvice(scanResults) {
    try {
      const prompt = `
As a cybersecurity consultant, provide a brief security assessment summary based on these scan results:

Total Vulnerabilities: ${scanResults.totalVulnerabilities}
Critical: ${scanResults.criticalCount}
High: ${scanResults.highCount}
Medium: ${scanResults.mediumCount}
Low: ${scanResults.lowCount}

Top Vulnerabilities Found:
${scanResults.topVulns.map((v, i) => `${i + 1}. ${v.vulnType} (${v.severity})`).join('\n')}

Provide:
1. Overall security rating (Critical/Poor/Fair/Good)
2. Top 3 priority actions to take
3. Brief risk assessment (2-3 sentences)

Keep it concise and actionable.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Gemini Security Advice Error:', error);
      throw new Error('Failed to generate security advice');
    }
  }
}

module.exports = new GeminiService();