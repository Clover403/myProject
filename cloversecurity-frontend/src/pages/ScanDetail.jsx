import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { scanAPI, aiAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  ArrowLeft,
  Shield,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import AIChatPanel from "../components/AIChatPanel";

function ScanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const surfaceClass = isDark
    ? "bg-[#151822] border border-[#1f2330]"
    : "bg-white shadow";
  const dividerClass = isDark ? "border-[#1f2330]" : "border-gray-200";
  const mutedTextClass = isDark ? "text-gray-400" : "text-gray-600";
  const subtleTextClass = isDark ? "text-gray-400" : "text-gray-500";
  const defaultTextClass = isDark ? "text-gray-300" : "text-gray-600";

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

  const conversationId = useMemo(
    () => (scan && scan.id ? `scan-${scan.id}` : `scan-${id}`),
    [scan, id]
  );

  const scanContext = useMemo(() => {
    if (!scan) {
      return null;
    }

    return {
      scanId: scan.id,
      url: scan.url,
      status: scan.status,
      timestamp: scan.createdAt,
      summary: {
        totalVulnerabilities: scan.totalVulnerabilities,
        critical: scan.criticalCount,
        high: scan.highCount,
        medium: scan.mediumCount,
        low: scan.lowCount,
      },
      vulnerabilities: (scan.vulnerabilities || []).slice(0, 6).map((vuln) => ({
        id: vuln.id,
        type: vuln.vulnType,
        severity: vuln.severity,
        location: vuln.location,
      })),
    };
  }, [scan]);

  const chatSuggestions = useMemo(() => {
    if (!scan) {
      return [
        "Summarise the key risks from this scan.",
        "Outline the next remediation steps I should take.",
        "What evidence should I collect to verify fixes?",
      ];
    }

    const topVuln = (scan.vulnerabilities || [])[0];

    return [
      "Summarise the critical issues and prioritise remediation.",
      topVuln
        ? `Explain how to resolve the ${topVuln.vulnType} finding.`
        : "Give me mitigation steps for the highest severity vulnerabilities.",
      "Create a checklist to validate remediation after fixes.",
    ];
  }, [scan]);

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
    setAiExplanation(
      vulnerability.aiExplanation
        ? { ...vulnerability.aiExplanation, cached: true }
        : null
    );

    if (vulnerability.aiExplanation) {
      return; // Already have explanation
    }

    setLoadingAI(true);
    try {
      const response = await aiAPI.explainVulnerability(vulnerability.id);
      setAiExplanation({
        ...response.data.explanation,
        usage: response.data.usage || null,
        cached: response.data.cached,
      });
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to generate AI explanation";
      alert(message);
    } finally {
      setLoadingAI(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (isDark) {
      const darkColors = {
        critical: "bg-[#341114] text-red-200 border-[#641e24]",
        high: "bg-[#392212] text-orange-200 border-[#6e3a19]",
        medium: "bg-[#3a3211] text-yellow-200 border-[#6f5a1a]",
        low: "bg-[#112d3a] text-blue-200 border-[#1f4f68]",
      };
      return (
        darkColors[severity] || "bg-[#1e2030] text-gray-200 border-[#2f3140]"
      );
    }

    const lightColors = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return lightColors[severity] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getVirusTotalVerdictStyles = (verdict) => {
    const mapping = {
      malicious: {
        badge: isDark
          ? "bg-[#341114] text-red-200 border-[#641e24]"
          : "bg-red-100 text-red-700 border-red-300",
        label: "Malicious",
      },
      suspicious: {
        badge: isDark
          ? "bg-[#392212] text-orange-200 border-[#6e3a19]"
          : "bg-orange-100 text-orange-700 border-orange-300",
        label: "Suspicious",
      },
      harmless: {
        badge: isDark
          ? "bg-[#11341e] text-green-200 border-[#1f5b34]"
          : "bg-green-100 text-green-700 border-green-300",
        label: "Harmless",
      },
      unknown: {
        badge: isDark
          ? "bg-[#1f2330] text-gray-300 border-[#2a2f3d]"
          : "bg-gray-100 text-gray-700 border-gray-300",
        label: "Unknown",
      },
      error: {
        badge: isDark
          ? "bg-[#341114] text-red-200 border-[#641e24]"
          : "bg-red-100 text-red-700 border-red-300",
        label: "Error",
      },
    };

    return mapping[verdict] || mapping.unknown;
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
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/scans"
            className={`flex items-center gap-2 mb-4 ${
              isDark
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scans
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1
                className={`text-3xl font-bold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                <Shield className="w-8 h-8 text-[#3ecf8e]" />
                Scan Results
              </h1>
              <p
                className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {scan.url}
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Scanned on {new Date(scan.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchScanDetail}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDark
                    ? "bg-[#1f2330] text-gray-200 hover:bg-[#262b3a]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-950 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {(scan.status === "scanning" || scan.status === "pending") && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
              isDark
                ? "bg-[#152c3b] border border-[#1e3a4c]"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <div
                className={`font-semibold ${
                  isDark ? "text-blue-200" : "text-blue-900"
                }`}
              >
                Scan in Progress
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-blue-300" : "text-blue-700"
                }`}
              >
                This page will update automatically when scan completes...
              </div>
            </div>
          </div>
        )}

        {scan.status === "failed" && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              isDark
                ? "bg-[#341114] border border-[#641e24]"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div
              className={`font-semibold ${
                isDark ? "text-red-200" : "text-red-900"
              }`}
            >
              Scan Failed
            </div>
            <div
              className={`text-sm mt-1 ${
                isDark ? "text-red-300" : "text-red-700"
              }`}
            >
              {scan.errorMessage || "Unknown error occurred"}
            </div>
          </div>
        )}

        {/* Summary */}
        {scan.status === "completed" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className={`${surfaceClass} p-4 rounded-lg`}>
                <div className={`text-sm ${mutedTextClass}`}>Total</div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {scan.totalVulnerabilities}
                </div>
              </div>
              <div className={`${surfaceClass} p-4 rounded-lg`}>
                <div className={`text-sm ${mutedTextClass}`}>Critical</div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-red-600"
                  }`}
                >
                  {scan.criticalCount}
                </div>
              </div>
              <div className={`${surfaceClass} p-4 rounded-lg`}>
                <div className={`text-sm ${mutedTextClass}`}>High</div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-orange-600"
                  }`}
                >
                  {scan.highCount}
                </div>
              </div>
              <div className={`${surfaceClass} p-4 rounded-lg`}>
                <div className={`text-sm ${mutedTextClass}`}>Medium</div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-yellow-600"
                  }`}
                >
                  {scan.mediumCount}
                </div>
              </div>
              <div className={`${surfaceClass} p-4 rounded-lg`}>
                <div className={`text-sm ${mutedTextClass}`}>Low</div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-blue-600"
                  }`}
                >
                  {scan.lowCount}
                </div>
              </div>
            </div>

            {(scan.virustotalVerdict || scan.virustotalStats) && (
              <div className={`${surfaceClass} rounded-lg mb-8`}>
                <div
                  className={`p-6 border-b ${dividerClass} flex items-center justify-between gap-4 flex-wrap`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-[#3ecf8e]" />
                    <div>
                      <h2
                        className={`text-xl font-semibold ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        VirusTotal Intelligence
                      </h2>
                      <p className={`text-sm ${subtleTextClass}`}>
                        Aggregated reputation across VirusTotal partners and
                        engines.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {scan.virustotalVerdict && (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          getVirusTotalVerdictStyles(scan.virustotalVerdict)
                            .badge
                        }`}
                      >
                        {
                          getVirusTotalVerdictStyles(scan.virustotalVerdict)
                            .label
                        }
                      </span>
                    )}
                    {scan.virustotalPermalink && (
                      <a
                        href={scan.virustotalPermalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-sm ${
                          isDark ? "text-[#3ecf8e]" : "text-green-600"
                        } hover:underline`}
                      >
                        View on VirusTotal
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {scan.virustotalVerdict === "error" ? (
                  <div className="p-6 flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isDark
                          ? "bg-[#341114] border border-[#641e24]"
                          : "bg-red-100 border border-red-300"
                      }`}
                    >
                      <AlertTriangle
                        className={isDark ? "text-red-200" : "text-red-600"}
                        size={16}
                      />
                    </div>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          isDark ? "text-red-200" : "text-red-700"
                        }`}
                      >
                        VirusTotal data unavailable
                      </div>
                      <div className={`text-sm mt-1 ${subtleTextClass}`}>
                        {scan.virustotalStats?.error ||
                          "The VirusTotal API returned an error while analysing this URL."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Malicious",
                          value:
                            scan.virustotalStats?.malicious ??
                            scan.virustotalMaliciousCount ??
                            0,
                        },
                        {
                          label: "Suspicious",
                          value: scan.virustotalStats?.suspicious ?? 0,
                        },
                        {
                          label: "Harmless",
                          value: scan.virustotalStats?.harmless ?? 0,
                        },
                        {
                          label: "Undetected",
                          value: scan.virustotalStats?.undetected ?? 0,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`p-4 rounded-lg border border-dashed ${
                            isDark
                              ? "bg-[#151822] border-[#1f2330]"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className={`text-sm ${mutedTextClass}`}>
                            {item.label}
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {scan.virustotalLastAnalysisDate && (
                      <div className={`mt-4 text-sm ${subtleTextClass}`}>
                        Last analysed on{" "}
                        {new Date(
                          scan.virustotalLastAnalysisDate
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Vulnerabilities List */}
            <div className={`${surfaceClass} rounded-lg mb-8`}>
              <div className={`p-6 border-b ${dividerClass}`}>
                <h2
                  className={`text-xl font-semibold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Vulnerabilities Found ({scan.vulnerabilities?.length || 0})
                </h2>
              </div>

              <div
                className={`divide-y ${
                  isDark ? "divide-[#1f2330]" : "divide-gray-200"
                }`}
              >
                {scan.vulnerabilities?.length === 0 ? (
                  <div
                    className={`p-6 text-center ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
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
                            <h3
                              className={`text-lg font-semibold ${
                                isDark ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
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
                          <p className={`text-sm mb-2 ${defaultTextClass}`}>
                            {vuln.description}
                          </p>
                          <div className={`text-sm ${subtleTextClass}`}>
                            <span className="font-medium">Location:</span>{" "}
                            {vuln.location || "N/A"}
                          </div>
                          {vuln.parameter && (
                            <div className={`text-sm ${subtleTextClass}`}>
                              <span className="font-medium">Parameter:</span>{" "}
                              {vuln.parameter}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExplainVuln(vuln)}
                        className="mt-3 px-4 py-2 bg-purple-950 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
                      >
                        Explain with AI
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <AIChatPanel
          conversationId={conversationId}
          context={scanContext}
          description="Turn raw findings into actionable steps. Clover AI cross-references this scan's context to keep guidance precise."
          placeholder="Ask Clover AI how to mitigate these findings…"
          suggestions={chatSuggestions}
          className="mb-8"
        />
      </div>

      {/* AI Explanation Modal */}
      {selectedVuln && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${
              isDark ? "bg-[#151822] text-gray-100" : "bg-white"
            } rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between sticky top-0 ${
                isDark
                  ? "bg-[#151822] border-[#1f2330]"
                  : "bg-white border-gray-200"
              }`}
            >
              <h2
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                🤖 AI Security Assistant
              </h2>
              <button
                onClick={() => setSelectedVuln(null)}
                className={`${
                  isDark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Vulnerability Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className={`text-xl font-semibold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
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
                <p className={defaultTextClass}>{selectedVuln.description}</p>
              </div>

              {/* AI Explanation */}
              {loadingAI ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className={defaultTextClass}>
                      Generating AI explanation...
                    </p>
                  </div>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-6">
                  {/* Explanation */}
                  <div>
                    <h4
                      className={`font-semibold mb-2 ${
                        isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      Explanation
                    </h4>
                    <div
                      className={`rounded-lg p-4 whitespace-pre-wrap ${
                        isDark
                          ? "bg-[#2b1a3d] text-purple-200"
                          : "bg-purple-50 text-gray-700"
                      }`}
                    >
                      {aiExplanation.explanation}
                    </div>
                  </div>

                  {/* Fix Recommendation */}
                  {aiExplanation.fixRecommendation && (
                    <div>
                      <h4
                        className={`font-semibold mb-2 ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        How to Fix ?
                      </h4>
                      <div
                        className={`rounded-lg p-4 whitespace-pre-wrap ${
                          isDark
                            ? "bg-[#183424] text-green-200"
                            : "bg-green-50 text-gray-700"
                        }`}
                      >
                        {aiExplanation.fixRecommendation}
                      </div>
                    </div>
                  )}

                  {/* Additional Resources */}
                  {aiExplanation.additionalResources &&
                    aiExplanation.additionalResources.length > 0 && (
                      <div>
                        <h4
                          className={`font-semibold mb-2 ${
                            isDark ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          Learn More
                        </h4>
                        <ul
                          className={`rounded-lg p-4 space-y-2 ${
                            isDark ? "bg-[#152c3b] text-blue-200" : "bg-blue-50"
                          }`}
                        >
                          {aiExplanation.additionalResources.map(
                            (resource, index) => (
                              <li
                                key={index}
                                className={
                                  isDark ? "text-blue-200" : "text-blue-700"
                                }
                              >
                                • {resource}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* AI Model Info */}
                  <div className={`text-xs text-right ${subtleTextClass}`}>
                    Generated by{" "}
                    {aiExplanation.usage?.provider?.toUpperCase() ||
                      aiExplanation.aiModel ||
                      "AI"}
                    {aiExplanation.usage?.tokens?.total
                      ? ` • ${aiExplanation.usage.tokens.total} tokens`
                      : aiExplanation.tokensUsed
                      ? ` • ${aiExplanation.tokensUsed} tokens`
                      : ""}
                    {aiExplanation.cached ? " • Cached" : ""}
                  </div>
                </div>
              ) : null}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedVuln(null)}
                  className={`px-6 py-2 rounded-lg ${
                    isDark
                      ? "bg-[#282b36] text-gray-200 hover:bg-[#323546]"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  }`}
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
