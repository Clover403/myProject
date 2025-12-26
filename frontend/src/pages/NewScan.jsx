import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowLeft } from 'lucide-react';

function NewScan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [url, setUrl] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [targetId, setTargetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialState = location.state || {};
    if (initialState.url) {
      setUrl(initialState.url);
    }
    if (initialState.targetId) {
      setTargetId(Number(initialState.targetId));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate URL
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        throw new Error('Please enter a valid URL (must start with http:// or https://)');
      }

      const scanData = {
        url,
        scanType,
  targetId: targetId != null ? targetId : null
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
    } finally {
      setLoading(false);
    }
  };

  return (
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What will be scanned?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ SQL Injection vulnerabilities</li>
                <li>✓ Cross-Site Scripting (XSS)</li>
                <li>✓ Security misconfigurations</li>
                <li>✓ Known vulnerable components</li>
                <li>✓ And more security issues...</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !url}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white transition
                ${loading || !url
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting Scan...
                </span>
              ) : (
                'Start Security Scan'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewScan;