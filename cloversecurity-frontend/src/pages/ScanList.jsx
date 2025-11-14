import React,{ useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Trash2, Search, AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

function ScanList() {
  const { isDark } = useTheme();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchScans = useCallback(async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await scanAPI.getAllScans({ limit: 50 });
      setScans(response.data.scans);
    } catch (error) {
      console.error('Failed to fetch scans:', error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchScans({ showLoader: true });
  }, [fetchScans]);

  useEffect(() => {
    const hasActiveScan = scans.some(
      (scan) => scan.status === 'pending' || scan.status === 'scanning'
    );

    if (!hasActiveScan) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchScans();
    }, 8000);

    return () => clearInterval(intervalId);
  }, [scans, fetchScans]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this scan?')) {
      return;
    }

    try {
  await scanAPI.deleteScan(id);
  await fetchScans({ showLoader: true });
    } catch (error) {
      alert('Failed to delete scan');
    }
  };

  const filteredScans = scans.filter(scan =>
    scan.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className={`flex items-center gap-2 mb-4 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Scan History</h1>
          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>View and manage all your security scans</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search by URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition-all ${isDark ? "bg-[#1a1d24] border-[#2a2e38] text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
            />
          </div>
        </div>

        {/* Scans List */}
        <div className={`rounded-lg shadow overflow-hidden ${isDark ? "bg-[#1a1d24] border border-[#2a2e38]" : "bg-white"}`}>
          <table className={`min-w-full divide-y ${isDark ? "divide-[#2a2e38]" : "divide-gray-200"}`}>
            <thead className={isDark ? "bg-[#0f1117]" : "bg-gray-50"}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  URL
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Vulnerabilities
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-[#2a2e38]" : "divide-gray-200"}`}>
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`px-6 py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    No scans found
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => (
                  <tr key={scan.id} className={`transition-colors ${isDark ? "hover:bg-[#25272e]" : "hover:bg-gray-50"}`}>
                    <td className={`px-6 py-4 font-medium ${isDark ? "text-[#3ecf8e]" : "text-blue-600"} hover:opacity-80`}>
                      <Link
                        to={`/scans/${scan.id}`}
                        className="flex items-center gap-2"
                      >
                        {scan.url}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-3 py-1 text-xs rounded-full
                        ${scan.status === 'completed' ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700' : ''}
                        ${scan.status === 'scanning' ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700' : ''}
                        ${scan.status === 'failed' ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' : ''}
                        ${scan.status === 'pending' ? isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {scan.status === 'completed' ? (
                        <div className="flex gap-3 items-center">
                          {scan.criticalCount > 0 && (
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                              <AlertOctagon className="w-4 h-4" />
                              {scan.criticalCount}
                            </span>
                          )}
                          {scan.highCount > 0 && (
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                              <AlertTriangle className="w-4 h-4" />
                              {scan.highCount}
                            </span>
                          )}
                          {scan.totalVulnerabilities === 0 && (
                            <span className={`inline-flex items-center gap-1 text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                              <ShieldCheck className="w-4 h-4" />
                              Clean
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleDelete(scan.id, e)}
                        className={`${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"} transition-colors`}
                        title="Delete scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ScanList;