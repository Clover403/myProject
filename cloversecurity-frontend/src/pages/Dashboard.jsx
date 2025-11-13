import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { scanAPI, targetAPI } from "../services/api";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Activity,
  Plus,
  Globe,
  AlertCircle,
} from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [targetFormData, setTargetFormData] = useState({
    url: "",
    name: "",
    description: "",
    tags: "",
  });
  const [addingTarget, setAddingTarget] = useState(false);
  const [addTargetError, setAddTargetError] = useState("");
  const { isDark } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, scansRes] = await Promise.all([
        scanAPI.getStats(),
        scanAPI.getAllScans({ limit: 5 }),
      ]);

      setStats(statsRes.data.stats);
      setRecentScans(scansRes.data.scans);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // If 401, token might be invalid - could trigger logout
      if (error.response?.status === 401) {
        console.warn("Authentication failed - token may be invalid");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    if (isDark) {
      const colors = {
        critical: "bg-red-900 text-red-200 border-red-700",
        high: "bg-orange-900 text-orange-200 border-orange-700",
        medium: "bg-yellow-900 text-yellow-200 border-yellow-700",
        low: "bg-blue-900 text-blue-200 border-blue-700",
      };
      return colors[severity] || "bg-gray-700 text-gray-300 border-gray-600";
    }
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[severity] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    setAddingTarget(true);
    setAddTargetError("");

    try {
      // Validate URL format
      if (!targetFormData.url.startsWith('http://') && !targetFormData.url.startsWith('https://')) {
        throw new Error('URL must start with http:// or https://');
      }

      const targetData = {
        ...targetFormData,
        tags: targetFormData.tags
          ? targetFormData.tags.split(",").map((t) => t.trim())
          : [],
      };

      await targetAPI.createTarget(targetData);
      
      setShowAddTargetModal(false);
      setTargetFormData({ url: "", name: "", description: "", tags: "" });
      
      // Success - could add notification here
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Failed to add target";
      setAddTargetError(errorMsg);
      console.error('Add target error:', error);
    } finally {
      setAddingTarget(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "completed")
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "scanning")
      return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    if (status === "failed")
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#0f1117]" : "bg-white"}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f1117] text-gray-200" : "bg-white text-gray-900"}`}>
      <Navbar />

      {/* Header */}
      <div className={`border-b py-8 ${isDark ? "border-[#1a1d24] bg-[#111318]" : "border-gray-200 bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`p-3 rounded-lg ${isDark ? "bg-[#3ecf8e]/10" : "bg-green-100"}`}>
              <Activity className="w-6 h-6 text-[#3ecf8e]" />
            </div>
            <h1 className={`text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
              Dashboard
            </h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Your security monitoring overview</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDark ? "bg-[#0f1117]" : "bg-white"}`}>
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              {
                title: "Total Scans",
                value: stats?.totalScans || 0,
                icon: Zap,
              },
              {
                title: "Active Scans",
                value: stats?.activeScans || 0,
                icon: Activity,
              },
              {
                title: "Vulnerabilities",
                value: stats?.vulnerabilitiesFound || 0,
                icon: AlertTriangle,
              },
              {
                title: "Completed Scans",
                value: stats?.completedScans || 0,
                icon: CheckCircle,
              },
            ].map(({ title, value, icon: Icon }, i) => (
              <div
                key={i}
                className={`border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${isDark ? "bg-[#1a1d24] border-[#2a2e38] hover:border-[#3ecf8e]/30" : "bg-gray-50 border-gray-200 hover:border-green-400"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {title}
                    </p>
                    <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? "bg-[#3ecf8e]/10" : "bg-green-100"}`}>
                    <Icon className="w-5 h-5 text-[#3ecf8e]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Target Section */}
          <div className={`border rounded-xl shadow-lg overflow-hidden ${isDark ? "bg-[#1a1d24] border-[#2a2e38]" : "bg-gray-50 border-gray-200"}`}>
            <div className={`px-6 py-4 border-b ${isDark ? "border-[#2a2e38]" : "border-gray-200"}`}>
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                <Plus className="w-5 h-5 text-[#3ecf8e]" />
                Quick Add Target
              </h2>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Add a new target directly from dashboard
              </p>
            </div>

            <div className={`px-6 py-6 ${isDark ? "bg-[#0f1117]/50" : "bg-white"}`}>
              <form onSubmit={handleAddTarget} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className={`absolute left-3 top-3.5 w-4 h-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                    <input
                      type="url"
                      value={targetFormData.url}
                      onChange={(e) => setTargetFormData({ ...targetFormData, url: e.target.value })}
                      placeholder="https://example.com"
                      required
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#1a1d24] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Target Name
                  </label>
                  <input
                    type="text"
                    value={targetFormData.name}
                    onChange={(e) => setTargetFormData({ ...targetFormData, name: e.target.value })}
                    placeholder="e.g., Production"
                    required
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#1a1d24] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Tags
                  </label>
                  <input
                    type="text"
                    value={targetFormData.tags}
                    onChange={(e) => setTargetFormData({ ...targetFormData, tags: e.target.value })}
                    placeholder="e.g., production"
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#1a1d24] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={addingTarget}
                    className="flex-1 bg-[#3ecf8e] hover:bg-[#52ffb2] text-black font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Target
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTargetModal(true)}
                    className={`px-3 py-2.5 text-sm rounded-lg border font-semibold transition ${isDark ? "border-[#2a2e38] text-gray-300 hover:bg-[#2a2e38]" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                  >
                    Details
                  </button>
                </div>
              </form>

              {addTargetError && (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 ${isDark ? "bg-red-500/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                  <p className={isDark ? "text-red-300 text-sm" : "text-red-700 text-sm"}>{addTargetError}</p>
                </div>
              )}
            </div>
          </div>
          <div className={`border rounded-xl shadow-lg overflow-hidden ${isDark ? "bg-[#1a1d24] border-[#2a2e38]" : "bg-gray-50 border-gray-200"}`}>
            {/* Table Header */}
            <div className={`px-6 py-4 border-b ${isDark ? "border-[#2a2e38]" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Recent Scans
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Latest scan activities
                  </p>
                </div>
                <Link
                  to="/scans"
                  className="text-[#3ecf8e] hover:text-[#52ffb2] font-medium flex items-center gap-2 transition-colors"
                >
                  View All 
                  <TrendingUp className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Table Content */}
            <div className="px-6 py-4">
              {recentScans.length > 0 ? (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? "border-[#2a2e38]" : "border-gray-200"}`}>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Target
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Status
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Vulnerabilities
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Severity
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Date
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-[#2a2e38]" : "divide-gray-200"}`}>
                      {recentScans.map((scan) => (
                        <tr
                          key={scan.id}
                          className={`transition-colors ${isDark ? "hover:bg-[#232630]" : "hover:bg-gray-100"}`}
                        >
                          <td className={`px-6 py-4 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                            {scan.targetUrl}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(scan.status)}
                              <span className={`capitalize text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {scan.status}
                              </span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 font-medium ${isDark ? "text-gray-300" : "text-gray-900"}`}>
                            {scan.vulnerabilities?.length || 0}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadge(
                                scan.severityLevel
                              )}`}
                            >
                              {scan.severityLevel || "N/A"}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(scan.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/scans/${scan.id}`}
                              className="text-[#3ecf8e] hover:text-[#52ffb2] font-medium transition-colors"
                            >
                              View Details →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`p-4 rounded-full mb-4 ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                    <Shield className={`w-12 h-12 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    No scans yet
                  </h3>
                  <p className={`mb-6 max-w-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Start your first security scan to identify vulnerabilities in your web applications
                  </p>
                  <Link
                    to="/new-scan"
                    className="inline-flex items-center gap-2 bg-[#3ecf8e] hover:bg-[#52ffb2] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Zap className="w-4 h-4" />
                    Create New Scan
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Target Modal (Detailed Form) */}
      {showAddTargetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-2xl w-full shadow-2xl border ${isDark ? "bg-[#1a1d24] border-[#2a2e38]" : "bg-white border-gray-200"}`}>
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? "border-[#2a2e38] bg-[#0f1117]/50" : "border-gray-200 bg-gray-50"}`}>
              <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                <Globe className="w-6 h-6 text-[#3ecf8e]" />
                Add Target Details
              </h2>
            </div>

            <form onSubmit={handleAddTarget} className="p-6 space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Website URL *
                </label>
                <div className="relative">
                  <Globe className={`absolute left-3 top-3.5 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="url"
                    value={targetFormData.url}
                    onChange={(e) => setTargetFormData({ ...targetFormData, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Target Name *
                </label>
                <input
                  type="text"
                  value={targetFormData.name}
                  onChange={(e) => setTargetFormData({ ...targetFormData, name: e.target.value })}
                  placeholder="e.g., Production Website"
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Description (Optional)
                </label>
                <textarea
                  value={targetFormData.description}
                  onChange={(e) => setTargetFormData({ ...targetFormData, description: e.target.value })}
                  placeholder="e.g., Main payment processing system"
                  rows="3"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition resize-none ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Tags (Comma Separated, Optional)
                </label>
                <input
                  type="text"
                  value={targetFormData.tags}
                  onChange={(e) => setTargetFormData({ ...targetFormData, tags: e.target.value })}
                  placeholder="e.g., production, critical, api"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                />
              </div>

              {addTargetError && (
                <div className={`p-3 rounded-lg flex items-start gap-3 ${isDark ? "bg-red-500/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                  <p className={isDark ? "text-red-300 text-sm" : "text-red-700 text-sm"}>{addTargetError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t" style={{borderColor: isDark ? "#2a2e38" : "#e5e7eb"}}>
                <button
                  type="button"
                  onClick={() => setShowAddTargetModal(false)}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${isDark ? "bg-[#0f1117] text-gray-300 hover:bg-[#2a2e38]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTarget}
                  className="flex-1 px-4 py-3 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] font-semibold transition disabled:opacity-50"
                >
                  {addingTarget ? "Adding..." : "Add Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;