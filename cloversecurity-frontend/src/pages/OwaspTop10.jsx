import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Lock,
  Database,
  Code,
  AlertTriangle,
  Settings,
  Package,
  Key,
  FileCheck,
  Eye,
  Network,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
  MessageCircle,
  X as CloseIcon,
  Send,
  Sparkles,
} from 'lucide-react';
import { aiAPI } from '../services/api';

function OwaspTop10() {
  const { isDark } = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleAskAI = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiLoading(true);

    // Add user message
    const newMessages = [
      ...aiMessages,
      { role: 'user', content: userMessage }
    ];
    setAiMessages(newMessages);

    try {
      const response = await aiAPI.chat({
        messages: newMessages,
        context: 'owasp-top-10'
      });

      setAiMessages([
        ...newMessages,
        { role: 'assistant', content: response.data.message.content }
      ]);
    } catch (error) {
      console.error('AI chat error:', error);
      setAiMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const owaspRisks = [
    {
      id: 1,
      title: 'Broken Access Control',
      icon: Shield,
      riskLevel: 'Critical',
      prevalence: 'Common',
      impact: 'Severe',
      color: 'red',
      description: 'Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data or performing a business function outside the user\'s limits.',
      vulnerabilities: [
        'Bypassing access control checks by modifying the URL, internal application state, or HTML page',
        'Allowing the primary key to be changed to another user\'s record',
        'Elevation of privilege (acting as a user without being logged in or acting as an admin when logged in as a user)',
        'Metadata manipulation, such as replaying or tampering with JWT tokens',
        'CORS misconfiguration allowing unauthorized API access',
        'Force browsing to authenticated pages as an unauthenticated user'
      ],
      examples: [
        'Insecure Direct Object References (IDOR): Changing user_id=123 to user_id=456 in URL',
        'Missing function-level access control: Regular users accessing admin-only endpoints',
        'Path traversal attacks: ../../etc/passwd to access restricted files'
      ],
      prevention: [
        'Implement access control mechanisms once and re-use them throughout the application',
        'Deny by default: Except for public resources, deny access by default',
        'Model access controls to enforce record ownership',
        'Disable web server directory listing',
        'Log access control failures and alert admins when appropriate',
        'Rate limit API and controller access to minimize automated attack tool harm',
        'Invalidate JWT tokens on the server after logout'
      ]
    },
    {
      id: 2,
      title: 'Cryptographic Failures',
      icon: Lock,
      riskLevel: 'High',
      prevalence: 'Common',
      impact: 'Severe',
      color: 'orange',
      description: 'Previously known as "Sensitive Data Exposure," this category focuses on failures related to cryptography (or lack thereof), which often leads to exposure of sensitive data. This includes passwords, credit card numbers, health records, personal information, and business secrets.',
      vulnerabilities: [
        'Transmitting data in clear text (HTTP, FTP, SMTP)',
        'Using old or weak cryptographic algorithms (MD5, SHA1, DES)',
        'Using default, weak, or hard-coded cryptographic keys',
        'Not enforcing encryption with security directives or headers',
        'Not validating server certificates and trust chains',
        'Using deprecated hash functions for passwords (MD5, SHA1)'
      ],
      examples: [
        'Sensitive data transmitted over HTTP instead of HTTPS',
        'Passwords stored using weak hashing (MD5)',
        'Credit card data stored without encryption'
      ],
      prevention: [
        'Classify data processed, stored, or transmitted by the application',
        'Don\'t store sensitive data unnecessarily; discard it as soon as possible',
        'Encrypt all sensitive data at rest using strong algorithms (AES-256)',
        'Encrypt all data in transit using secure protocols (TLS 1.3, HTTPS)',
        'Disable caching for responses containing sensitive data',
        'Use strong adaptive and salted hashing functions (Argon2, scrypt, bcrypt, PBKDF2)',
        'Initialize cryptographic keys properly and manage them securely',
        'Use authenticated encryption instead of just encryption'
      ]
    },
    {
      id: 3,
      title: 'Injection',
      icon: Code,
      riskLevel: 'Critical',
      prevalence: 'Common',
      impact: 'Severe',
      color: 'red',
      description: 'Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. The attacker\'s hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization.',
      vulnerabilities: [
        'SQL Injection: Malicious SQL code inserted into application queries',
        'NoSQL Injection: Targeting NoSQL databases (MongoDB, CouchDB)',
        'Command Injection (OS Injection): Executing arbitrary system commands',
        'LDAP Injection: Modifying LDAP queries to bypass authentication',
        'XPath Injection: Manipulating XPath queries',
        'Template Injection: Injecting code into template engines'
      ],
      examples: [
        'SQL: SELECT * FROM users WHERE username = \'admin\' OR \'1\'=\'1\' --',
        'Command: ping 8.8.8.8; cat /etc/passwd',
        'NoSQL: {"username": {"$ne": null}, "password": {"$ne": null}}'
      ],
      prevention: [
        'Use Parameterized Queries (Prepared Statements)',
        'Use ORM/ODM Libraries: Sequelize, Hibernate, Mongoose',
        'Input Validation: Whitelist allowed characters and patterns',
        'Escape Special Characters: Context-specific escaping',
        'Principle of Least Privilege: Database accounts should have minimal permissions',
        'Use Stored Procedures: When properly written, they prevent injection',
        'Web Application Firewalls (WAF): ModSecurity, AWS WAF, Cloudflare WAF'
      ]
    },
    {
      id: 4,
      title: 'Insecure Design',
      icon: AlertTriangle,
      riskLevel: 'High',
      prevalence: 'Widespread',
      impact: 'Variable',
      color: 'yellow',
      description: 'Insecure design is a broad category representing different weaknesses in design and architectural flaws. It calls for more use of threat modeling, secure design patterns, and reference architectures.',
      vulnerabilities: [
        'Missing or ineffective security controls',
        'Lack of threat modeling during design phase',
        'Insufficient security requirements gathering',
        'Failure to consider edge cases and abuse scenarios',
        'Over-reliance on client-side security controls',
        'Missing rate limiting and resource exhaustion protections',
        'Insecure business logic'
      ],
      examples: [
        'Security questions with easily guessable answers',
        'Client-side price calculation allowing price manipulation',
        'Unrestricted file upload without validation'
      ],
      prevention: [
        'Establish and use a secure development lifecycle with AppSec professionals',
        'Use threat modeling for critical authentication, access control, business logic, and key flows',
        'Integrate security language and controls into user stories',
        'Write unit and integration tests to validate critical flows',
        'Segregate tier layers on the system and network layers',
        'Limit resource consumption by user or service'
      ]
    },
    {
      id: 5,
      title: 'Security Misconfiguration',
      icon: Settings,
      riskLevel: 'High',
      prevalence: 'Very Common',
      impact: 'Moderate to Severe',
      color: 'orange',
      description: 'Security misconfiguration is the most commonly seen issue. This is commonly a result of insecure default configurations, incomplete or ad hoc configurations, open cloud storage, misconfigured HTTP headers, and verbose error messages.',
      vulnerabilities: [
        'Default Credentials: admin/admin, root/password',
        'Directory Listing Enabled: Exposing file structure',
        'Detailed Error Messages: Stack traces visible to users',
        'Unnecessary Features Enabled: Admin consoles, debug modes',
        'Outdated Software: Unpatched frameworks, libraries, dependencies',
        'Missing Security Headers: CSP, HSTS, X-Frame-Options'
      ],
      examples: [
        'MongoDB accessible on default port without authentication',
        'AWS S3 bucket publicly accessible',
        'Application running in debug mode in production'
      ],
      prevention: [
        'Implement a repeatable hardening process',
        'Remove or don\'t install unused features, frameworks, and documentation',
        'Review and update configurations as part of patch management',
        'Implement a segmented application architecture',
        'Send security directives to clients (security headers)',
        'Automate configuration verification process',
        'Use Infrastructure as Code (IaC) with security scanning'
      ]
    },
    {
      id: 6,
      title: 'Vulnerable and Outdated Components',
      icon: Package,
      riskLevel: 'High',
      prevalence: 'Very Common',
      impact: 'Moderate to Critical',
      color: 'red',
      description: 'Components such as libraries, frameworks, and other software modules run with the same privileges as the application. If a vulnerable component is exploited, such an attack can facilitate serious data loss or server takeover.',
      vulnerabilities: [
        'Unknown Component Versions: Not knowing versions of all components',
        'Vulnerable Software: Using vulnerable, unsupported, or out of date software',
        'Lack of Scanning: Not regularly scanning for vulnerabilities',
        'Delayed Patching: Not fixing or upgrading in a timely fashion',
        'Component Incompatibility: Not testing compatibility of updated libraries',
        'Unsecured Configurations: Not securing component configurations'
      ],
      examples: [
        'Equifax Breach (2017): Unpatched Apache Struts vulnerability',
        'Heartbleed (2014): OpenSSL library vulnerability',
        'Log4Shell (2021): Log4j remote code execution'
      ],
      prevention: [
        'Maintain a bill of materials (BOM) for all components',
        'Subscribe to security bulletins for components you use',
        'Only obtain components from official, trusted sources',
        'Monitor for unmaintained or insecure components',
        'Use Software Composition Analysis (SCA) tools',
        'Automate dependency updates where possible'
      ]
    },
    {
      id: 7,
      title: 'Identification and Authentication Failures',
      icon: Key,
      riskLevel: 'Critical',
      prevalence: 'Common',
      impact: 'Severe',
      color: 'red',
      description: 'Previously known as "Broken Authentication," this category covers confirmation of the user\'s identity, authentication, and session management. Authentication failures can allow attackers to compromise passwords, keys, or session tokens.',
      vulnerabilities: [
        'Weak Password Policies: No minimum length, complexity requirements',
        'Credential Stuffing & Brute Force: No rate limiting or account lockout',
        'Session Management Issues: Tokens exposed in URL, not invalidated after logout',
        'MFA Weaknesses: MFA not enforced, SMS-based MFA vulnerable to SIM swapping',
        'Password Reset Poisoning: Manipulating reset links',
        'Session Fixation: Predictable session IDs'
      ],
      examples: [
        'Credential stuffing using leaked username/password pairs',
        'Session hijacking via XSS or network sniffing',
        'Brute force attack on login form without rate limiting'
      ],
      prevention: [
        'Implement Multi-Factor Authentication (MFA)',
        'Use strong hashing: Argon2id, bcrypt (cost ≥ 10), scrypt',
        'Implement account lockout after failed attempts',
        'Rate limit login attempts per IP',
        'Use CAPTCHA after multiple failed attempts',
        'Secure session management with httpOnly, secure, sameSite cookies',
        'Invalidate sessions server-side on logout'
      ]
    },
    {
      id: 8,
      title: 'Software and Data Integrity Failures',
      icon: FileCheck,
      riskLevel: 'High',
      prevalence: 'Uncommon',
      impact: 'Critical',
      color: 'orange',
      description: 'This category focuses on making assumptions related to software updates, critical data, and CI/CD pipelines without verifying integrity. Includes insecure deserialization and supply chain attacks.',
      vulnerabilities: [
        'Insecure Deserialization: Untrusted data reconstructing objects',
        'Supply Chain Attacks: Compromised software updates, malicious packages',
        'Unsigned Updates: Software updates without signature verification',
        'CI/CD Pipeline Compromise: Unauthorized access to build pipelines',
        'Dependency Confusion: Malicious packages in public repositories',
        'Typosquatting: Similar package names (lodash vs lodassh)'
      ],
      examples: [
        'SolarWinds Hack: Compromised software updates',
        'npm package with malicious code injected',
        'Deserialization leading to remote code execution'
      ],
      prevention: [
        'Verify digital signatures on software updates',
        'Use Software Composition Analysis (SCA) tools',
        'Implement Subresource Integrity (SRI) for CDN resources',
        'Secure CI/CD pipeline with minimal permissions',
        'Use lock files to ensure dependency integrity',
        'Avoid deserialization of untrusted data',
        'Implement Runtime Application Self-Protection (RASP)'
      ]
    },
    {
      id: 9,
      title: 'Security Logging and Monitoring Failures',
      icon: Eye,
      riskLevel: 'Medium',
      prevalence: 'Very Common',
      impact: 'Moderate',
      color: 'yellow',
      description: 'Without logging and monitoring, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response allows attackers to achieve their goals without being detected.',
      vulnerabilities: [
        'No logging of authentication events',
        'Insufficient logging of security events',
        'Logs not monitored or reviewed',
        'No alerting on suspicious activities',
        'Logs stored insecurely or can be tampered',
        'Sensitive data logged (passwords, tokens)'
      ],
      examples: [
        'Breach goes undetected for months due to no monitoring',
        'Failed login attempts not logged or alerted',
        'Logs deleted by attacker after compromise'
      ],
      prevention: [
        'Log all authentication and authorization events',
        'Log security-relevant events (access to sensitive data, configuration changes)',
        'Implement centralized log management (ELK Stack, Splunk)',
        'Set up real-time monitoring and alerting',
        'Protect logs from tampering (append-only, separate storage)',
        'Implement Security Information and Event Management (SIEM)',
        'Regular log review and analysis'
      ]
    },
    {
      id: 10,
      title: 'Server-Side Request Forgery (SSRF)',
      icon: Network,
      riskLevel: 'High',
      prevalence: 'Common',
      impact: 'Severe',
      color: 'red',
      description: 'SSRF flaws occur whenever a web application fetches a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send crafted requests to unexpected destinations.',
      vulnerabilities: [
        'No URL validation on user-supplied input',
        'Access to internal network resources',
        'Cloud metadata endpoint access (AWS, Azure, GCP)',
        'Internal service exploitation',
        'Protocol exploitation (file://, dict://, gopher://)',
        'Port scanning internal network'
      ],
      examples: [
        'Capital One Breach (2019): SSRF to access AWS metadata',
        'Accessing internal admin panel: http://internal-admin.local/create-user',
        'Reading files: file:///etc/passwd',
        'AWS metadata: http://169.254.169.254/latest/meta-data/'
      ],
      prevention: [
        'Implement URL allowlisting (whitelist approved domains)',
        'Block private IP ranges and localhost',
        'Disable unnecessary URL schemas (file://, dict://, gopher://)',
        'Implement network segmentation',
        'Use proxy services for external requests',
        'Validate response content types',
        'Monitor for requests to internal IP ranges'
      ]
    }
  ];

  const getRiskColor = (color) => {
    const colors = {
      red: isDark ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-red-100 border-red-300 text-red-700',
      orange: isDark ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-orange-100 border-orange-300 text-orange-700',
      yellow: isDark ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'bg-yellow-100 border-yellow-300 text-yellow-700',
    };
    return colors[color] || colors.yellow;
  };

  const getRiskBadgeColor = (level) => {
    const colors = {
      Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[level] || colors.Medium;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1117]' : 'bg-gray-50'}`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`rounded-xl p-8 mb-8 border ${isDark ? 'bg-[#1a1d24] border-[#2a2e38]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-primary">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                OWASP Top 10 Web Application Security Risks
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Standard awareness document for developers and web application security
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <Info className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  The OWASP Top 10 represents a broad consensus about the most critical security risks to web applications. 
                  Organizations should adopt this document and start the process of ensuring that their web applications minimize these risks.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setAiChatOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                  isDark
                    ? 'bg-[#0f1117] text-gray-200 border border-[#2a2e38] hover:border-green-400 hover:text-white'
                    : 'bg-white text-gray-800 border border-gray-200 hover:border-green-400 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                Ask AI
              </button>
            </div>
          </div>
        </div>

        {/* Risk Cards */}
        <div className="space-y-4">
          {owaspRisks.map((risk) => {
            const Icon = risk.icon;
            const isExpanded = expandedSection === risk.id;
            
            return (
              <div
                key={risk.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isDark ? 'bg-[#1a1d24] border-[#2a2e38]' : 'bg-white border-gray-200'
                }`}
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => toggleSection(risk.id)}
                  className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${getRiskColor(risk.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-lg font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {risk.id}.
                        </span>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {risk.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskBadgeColor(risk.riskLevel)}`}>
                          {risk.riskLevel}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          isDark ? 'bg-gray-700/50 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          Prevalence: {risk.prevalence}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          isDark ? 'bg-gray-700/50 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          Impact: {risk.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  )}
                </button>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className={`px-6 pb-6 border-t ${isDark ? 'border-[#2a2e38]' : 'border-gray-200'}`}>
                    {/* Description */}
                    <div className="pt-6 mb-6">
                      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {risk.description}
                      </p>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="mb-6">
                      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Common Vulnerabilities
                      </h4>
                      <ul className="space-y-2">
                        {risk.vulnerabilities.map((vuln, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {vuln}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Examples */}
                    <div className="mb-6">
                      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Real-World Examples
                      </h4>
                      <div className="space-y-2">
                        {risk.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border text-sm font-mono ${
                              isDark ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prevention */}
                    <div>
                      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Prevention Strategies
                      </h4>
                      <ul className="space-y-2">
                        {risk.prevention.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {strategy}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className={`mt-8 p-6 rounded-xl border ${isDark ? 'bg-[#1a1d24] border-[#2a2e38]' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Remember
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Security is not a feature, it's a requirement
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Prevention is cheaper than remediation
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                The best time to implement security was yesterday, the next best time is now
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Assume breach: Plan for when, not if
              </span>
            </li>
          </ul>
          
          <div className={`mt-4 pt-4 border-t text-xs ${isDark ? 'border-[#2a2e38] text-gray-500' : 'border-gray-200 text-gray-500'}`}>
            This guide is based on OWASP Top 10 2021. For the most up-to-date information, visit{' '}
            <a
              href="https://owasp.org/www-project-top-ten/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline"
            >
              https://owasp.org/www-project-top-ten/
            </a>
          </div>
        </div>
      </div>

      {/* AI Chat Bubble - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {!aiChatOpen ? (
          <button
            onClick={() => setAiChatOpen(true)}
            className={`p-4 rounded-full shadow-lg transition-all hover:scale-110 ${
              isDark 
                ? 'bg-gradient-primary hover:shadow-green-500/20' 
                : 'bg-gradient-primary hover:shadow-green-500/30'
            }`}
            title="Ask AI about OWASP Top 10"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div className={`w-96 h-[500px] rounded-2xl shadow-2xl border flex flex-col ${
            isDark ? 'bg-[#1a1d24] border-[#2a2e38]' : 'bg-white border-gray-200'
          }`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-primary rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Ask AI about OWASP</h3>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-sm">Ask me anything about OWASP Top 10!</p>
                  <p className="text-xs mt-2">Example: "Explain SQL injection"</p>
                </div>
              ) : (
                aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-primary text-white'
                          : isDark
                          ? 'bg-[#0f1117] text-gray-300 border border-[#2a2e38]'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0f1117] border border-[#2a2e38]' : 'bg-gray-100'}`}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className={`p-4 border-t ${isDark ? 'border-[#2a2e38]' : 'border-gray-200'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                  placeholder="Ask about security risks..."
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDark 
                      ? 'bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAskAI}
                  disabled={!aiInput.trim() || aiLoading}
                  className="p-2 rounded-lg bg-gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OwaspTop10;
