import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { scanAPI } from '../services/api';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowLeft, AlertCircle, Info } from 'lucide-react';

function NewScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [url, setUrl] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [targetId, setTargetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Scan method selection
  const [scanMethods, setScanMethods] = useState({
    virustotal: true,
    owaspzap: false,
  });
  const [showZapAlert, setShowZapAlert] = useState(false);
  
  // Daily usage
  const [dailyUsage, setDailyUsage] = useState(null);

  useEffect(() => {
    const initialState = location.state || {};
    if (initialState.url) {
      setUrl(initialState.url);
    }
    if (initialState.targetId) {
      setTargetId(Number(initialState.targetId));
    }
    
    // Fetch daily scan usage
    fetchDailyUsage();
  }, [location.state]);

  const fetchDailyUsage = async () => {
    try {
      const response = await scanAPI.getScanUsage();
      setDailyUsage(response.data.usage);
    } catch (err) {
      console.error('Failed to fetch scan usage:', err);
    }
  };

  const handleZapToggle = () => {
    // Show alert when trying to enable OWASP ZAP
    setShowZapAlert(true);
    // Don't actually enable it
    setScanMethods(prev => ({ ...prev, owaspzap: false }));
  };

  const handleVirusTotalToggle = () => {
    setScanMethods(prev => ({ ...prev, virustotal: !prev.virustotal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if at least one scan method is selected
      if (!scanMethods.virustotal && !scanMethods.owaspzap) {
        throw new Error('Please select at least one scan method');
      }

      // Validate URL
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        throw new Error('Please enter a valid URL (must start with http:// or https://)');
      }

      const scanData = {
        url,
        scanType,
        targetId: targetId != null ? targetId : null,
        scanMethods,
      };

      const response = await scanAPI.startScan(scanData);
      
      console.log('✅ Scan created:', response.data);
      
      // Navigate to scan detail page
      navigate(`/scans/${response.data.scan.id}`);
      
    } catch (err) {
      console.error('❌ Scan error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to start scan';
      setError(errorMessage);
      
      // Refresh usage after error (might have hit limit)
      fetchDailyUsage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 mb-4 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <h1 className={`text-3xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <Shield className="w-8 h-8 text-[#3ecf8e]" />
            Create New Scan
          </h1>
          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Start a new security scan and identify vulnerabilities in your application
          </p>
          
          {/* Daily Usage Indicator */}
          {dailyUsage && (
            <div className={`mt-4 p-3 rounded-lg ${isDark ? "bg-[#1a1d24] border border-[#2a2e38]" : "bg-gray-100"}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Daily Scans: {dailyUsage.count} / {dailyUsage.limit}
                </span>
                <span className={`text-sm font-medium ${dailyUsage.remaining > 0 ? (isDark ? "text-[#3ecf8e]" : "text-green-600") : (isDark ? "text-red-400" : "text-red-600")}`}>
                  {dailyUsage.remaining} remaining
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${dailyUsage.remaining > 0 ? "bg-[#3ecf8e]" : "bg-red-500"}`}
                  style={{ width: `${(dailyUsage.count / dailyUsage.limit) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className={`rounded-lg shadow p-6 ${isDark ? "bg-[#1a1d24] border border-[#2a2e38]" : "bg-white"}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className={`px-4 py-3 rounded border ${isDark ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
                {error}
              </div>
            )}

            {/* Select from Targets */}
            {/* URL Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Target URL *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent ${isDark ? "bg-[#1a1d24] border-[#2a2e38] text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
              />
              <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                {targetId
                  ? "Loaded from your saved target. You can make adjustments before scanning."
                  : "Enter the full URL including http:// or https://"}
              </p>
            </div>

            {/* Scan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`
                  flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition
                  ${scanType === 'quick' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                `}>
                  <input
                    type="radio"
                    value="quick"
                    checked={scanType === 'quick'}
                    onChange={(e) => setScanType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Quick Scan</div>
                    <div className="text-sm text-gray-500 mt-1">~2-5 minutes</div>
                  </div>
                </label>

                <label className={`
                  flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition
                  ${scanType === 'deep' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                `}>
                  <input
                    type="radio"
                    value="deep"
                    checked={scanType === 'deep'}
                    onChange={(e) => setScanType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Deep Scan</div>
                    <div className="text-sm text-gray-500 mt-1">~5-15 minutes</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Scan Method Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Scan Method
              </label>
              <div className="space-y-3">
                {/* VirusTotal Option */}
                <label className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition
                  ${scanMethods.virustotal 
                    ? (isDark ? 'border-[#3ecf8e] bg-[#3ecf8e]/10' : 'border-green-500 bg-green-50')
                    : (isDark ? 'border-[#2a2e38] hover:border-[#3a3e48]' : 'border-gray-300 hover:border-gray-400')
                  }
                `}>
                  <input
                    type="checkbox"
                    checked={scanMethods.virustotal}
                    onChange={handleVirusTotalToggle}
                    className="w-5 h-5 text-[#3ecf8e] rounded border-gray-300 focus:ring-[#3ecf8e]"
                  />
                  <div className="ml-3 flex-1">
                    <div className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      VirusTotal
                    </div>
                    <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      URL reputation check across 70+ security vendors
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${isDark ? "bg-[#3ecf8e]/20 text-[#3ecf8e]" : "bg-green-100 text-green-700"}`}>
                    Available
                  </span>
                </label>

                {/* OWASP ZAP Option (Disabled) */}
                <label className={`
                  flex items-center p-4 border-2 rounded-lg cursor-pointer transition opacity-60
                  ${isDark ? 'border-[#2a2e38] bg-[#1a1d24]' : 'border-gray-300 bg-gray-50'}
                `}
                onClick={handleZapToggle}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="w-5 h-5 text-gray-400 rounded border-gray-300 cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className={`font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      OWASP ZAP
                    </div>
                    <div className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      Active vulnerability scanning (SQL Injection, XSS, etc.)
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700"}`}>
                    Demo Disabled
                  </span>
                </label>
              </div>

              {/* OWASP ZAP Alert */}
              {showZapAlert && (
                <div className={`mt-3 p-4 rounded-lg flex items-start gap-3 ${isDark ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
                  <div>
                    <div className={`font-medium ${isDark ? "text-yellow-300" : "text-yellow-800"}`}>
                      OWASP ZAP Currently Unavailable
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? "text-yellow-400/80" : "text-yellow-700"}`}>
                      During the demo period, OWASP ZAP scanning is temporarily disabled for efficiency. 
                      Please use VirusTotal for URL reputation scanning. Full OWASP ZAP integration will be available soon.
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowZapAlert(false)}
                      className={`mt-2 text-sm underline ${isDark ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-700 hover:text-yellow-800"}`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className={`rounded-lg p-4 ${isDark ? "bg-[#152030] border border-[#1e3040]" : "bg-blue-50 border border-blue-200"}`}>
              <div className="flex items-start gap-2">
                <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                <div>
                  <h3 className={`font-semibold mb-2 ${isDark ? "text-blue-300" : "text-blue-900"}`}>
                    What will be scanned?
                  </h3>
                  <ul className={`text-sm space-y-1 ${isDark ? "text-blue-200" : "text-blue-800"}`}>
                    <li>✓ URL reputation across 70+ security vendors</li>
                    <li>✓ Malware and phishing detection</li>
                    <li>✓ Domain and IP analysis</li>
                    <li>✓ Historical security data</li>
                    {scanMethods.owaspzap && (
                      <>
                        <li>✓ SQL Injection vulnerabilities</li>
                        <li>✓ Cross-Site Scripting (XSS)</li>
                        <li>✓ Security misconfigurations</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !url || !scanMethods.virustotal || (dailyUsage && dailyUsage.remaining <= 0)}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white transition
                ${loading || !url || !scanMethods.virustotal || (dailyUsage && dailyUsage.remaining <= 0)
                  ? (isDark ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed')
                  : 'bg-[#3ecf8e] hover:bg-[#35b87d]'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting Scan...
                </span>
              ) : dailyUsage && dailyUsage.remaining <= 0 ? (
                'Daily Scan Limit Reached'
              ) : (
                'Start Security Scan'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
    </Layout>
  );
}

export default NewScan;