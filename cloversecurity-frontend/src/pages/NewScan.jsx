import React,{ useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanAPI, targetAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Shield, ArrowLeft } from 'lucide-react';

function NewScan() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [url, setUrl] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [targetId, setTargetId] = useState('');
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await targetAPI.getAllTargets();
      setTargets(response.data.targets);
    } catch (err) {
      console.error('Failed to fetch targets:', err);
    }
  };

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
        targetId: targetId || null
      };

      const response = await scanAPI.startScan(scanData);
      
      // Navigate to scan detail page
      navigate(`/scans/${response.scan.id}`);
      
    } catch (err) {
      setError(err.message || 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const handleTargetSelect = (e) => {
    const selectedTargetId = e.target.value;
    setTargetId(selectedTargetId);
    
    if (selectedTargetId) {
      const selectedTarget = targets.find(t => t.id === parseInt(selectedTargetId));
      if (selectedTarget) {
        setUrl(selectedTarget.url);
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 mb-4 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select from Saved Targets (Optional)
              </label>
              <select
                value={targetId}
                onChange={handleTargetSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a target --</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name} - {target.url}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center text-gray-500 text-sm">OR</div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target URL *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the full URL including http:// or https://
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