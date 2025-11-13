import React,{ useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { scanAPI, aiAPI } from "../services/api";
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";

function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    fetchScanDetail();

    // Poll for scan status if still scanning
    const interval = setInterval(() => {
      if (scan?.status === "scanning" || scan?.status === "pending") {
        fetchScanStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchScanDetail = async () => {
    try {
      const response = await scanAPI.getScanById(id);
      setScan(response.data.scan);
      setNotes(response.data.scan.notes || "");
    } catch (error) {
      console.error("Failed to fetch scan:", error);
      alert("Scan not found");
      navigate("/scans");
    } finally {
      setLoading(false);
    }
  };

  const fetchScanStatus = async () => {
    try {
      const response = await scanAPI.getScanStatus(id);
      if (response.data.scan.status !== scan?.status) {
        fetchScanDetail(); // Refresh full data when status changes
      }
    } catch (error) {
      console.error("Failed to fetch scan status:", error);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await scanAPI.updateNotes(id, notes);
      alert("Notes saved successfully!");
    } catch (error) {
      alert("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this scan?")) {
      return;
    }

    try {
      await scanAPI.deleteScan(id);
      navigate("/scans");
    } catch (error) {
      alert("Failed to delete scan");
    }
  };

  const handleExplainVuln = async (vulnerability) => {
    setSelectedVuln(vulnerability);
    setAiExplanation(vulnerability.aiExplanation || null);

    if (vulnerability.aiExplanation) {
      return; // Already have explanation
    }

    setLoadingAI(true);
    try {
      const response = await aiAPI.explainVulnerability(vulnerability.id);
      setAiExplanation(response.data.explanation);
    } catch (error) {
      alert("Failed to generate AI explanation");
    } finally {
      setLoadingAI(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return colors[severity] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!scan) {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/scans")}
            className={`flex items-center gap-2 mb-4 ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scans
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                <Shield className="w-8 h-8 text-[#3ecf8e]" />
                Scan Results
              </h1>
              <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{scan.url}</p>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                Scanned on {new Date(scan.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchScanDetail}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {(scan.status === "scanning" || scan.status === "pending") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <div className="font-semibold text-blue-900">
                Scan in Progress
              </div>
              <div className="text-sm text-blue-700">
                This page will update automatically when scan completes...
              </div>
            </div>
          </div>
        )}

        {scan.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-red-900">Scan Failed</div>
            <div className="text-sm text-red-700 mt-1">
              {scan.errorMessage || "Unknown error occurred"}
            </div>
          </div>
        )}

        {/* Summary */}
        {scan.status === "completed" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-gray-900">
                  {scan.totalVulnerabilities}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Critical</div>
                <div className="text-2xl font-bold text-red-600">
                  {scan.criticalCount}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">High</div>
                <div className="text-2xl font-bold text-orange-600">
                  {scan.highCount}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Medium</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {scan.mediumCount}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Low</div>
                <div className="text-2xl font-bold text-blue-600">
                  {scan.lowCount}
                </div>
              </div>
            </div>

            {/* Vulnerabilities List */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vulnerabilities Found ({scan.vulnerabilities?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {scan.vulnerabilities?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="font-semibold">
                      No vulnerabilities found!
                    </div>
                    <div className="text-sm mt-1">
                      Your website appears to be secure.
                    </div>
                  </div>
                ) : (
                  scan.vulnerabilities?.map((vuln) => (
                    <div key={vuln.id} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {vuln.vulnType}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs rounded-full border ${getSeverityColor(
                                vuln.severity
                              )}`}
                            >
                              {vuln.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {vuln.description}
                          </p>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Location:</span>{" "}
                            {vuln.location || "N/A"}
                          </div>
                          {vuln.parameter && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Parameter:</span>{" "}
                              {vuln.parameter}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExplainVuln(vuln)}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                      >
                        🤖 Explain with AI
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes here..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingNotes ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>

      {/* AI Explanation Modal */}
      {selectedVuln && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                🤖 AI Security Assistant
              </h2>
              <button
                onClick={() => setSelectedVuln(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Vulnerability Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedVuln.vulnType}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${getSeverityColor(
                      selectedVuln.severity
                    )}`}
                  >
                    {selectedVuln.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600">{selectedVuln.description}</p>
              </div>

              {/* AI Explanation */}
              {loadingAI ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                      Generating AI explanation...
                    </p>
                  </div>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-6">
                  {/* Explanation */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      💬 Explanation
                    </h4>
                    <div className="bg-purple-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                      {aiExplanation.explanation}
                    </div>
                  </div>

                  {/* Fix Recommendation */}
                  {aiExplanation.fixRecommendation && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        🔧 How to Fix
                      </h4>
                      <div className="bg-green-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                        {aiExplanation.fixRecommendation}
                      </div>
                    </div>
                  )}

                  {/* Additional Resources */}
                  {aiExplanation.additionalResources &&
                    aiExplanation.additionalResources.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          📚 Learn More
                        </h4>
                        <ul className="bg-blue-50 rounded-lg p-4 space-y-2">
                          {aiExplanation.additionalResources.map(
                            (resource, index) => (
                              <li key={index} className="text-blue-700">
                                • {resource}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* AI Model Info */}
                  <div className="text-xs text-gray-500 text-right">
                    Generated by {aiExplanation.aiModel || "AI"}
                    {aiExplanation.tokensUsed &&
                      ` • ${aiExplanation.tokensUsed} tokens used`}
                  </div>
                </div>
              ) : null}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedVuln(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanDetail;
