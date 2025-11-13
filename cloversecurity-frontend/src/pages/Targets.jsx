import React,{ useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { targetAPI } from "../services/api";
import { useTheme } from '../context/ThemeContext';
import Navbar from "../components/Navbar";
import { ArrowLeft, Plus, Edit2, Trash2, ExternalLink, Globe, Tag, FileText } from "lucide-react";

function Targets() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [formData, setFormData] = useState({
    url: "",
    name: "",
    description: "",
    tags: "",
  });

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await targetAPI.getAllTargets();
      setTargets(response.data.targets);
    } catch (error) {
      console.error("Failed to fetch targets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const targetData = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
      };

      if (editingTarget) {
        await targetAPI.updateTarget(editingTarget.id, targetData);
      } else {
        await targetAPI.createTarget(targetData);
      }

      setShowModal(false);
      setEditingTarget(null);
      setFormData({ url: "", name: "", description: "", tags: "" });
      fetchTargets();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save target");
    }
  };

  const handleEdit = (target) => {
    setEditingTarget(target);
    setFormData({
      url: target.url,
      name: target.name,
      description: target.description || "",
      tags: target.tags?.join(", ") || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this target?")) {
      return;
    }

    try {
      await targetAPI.deleteTarget(id);
      fetchTargets();
    } catch (error) {
      alert("Failed to delete target");
    }
  };

  const handleNewTarget = () => {
    setEditingTarget(null);
    setFormData({ url: "", name: "", description: "", tags: "" });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f1117]" : "bg-gray-50"}`}>
      <Navbar />
      <div className="p-6">
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

            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Target Websites
                </h1>
                <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Manage your frequently scanned websites
                </p>
              </div>

              <button
                onClick={handleNewTarget}
                className="px-4 py-2 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] flex items-center gap-2 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Target
              </button>
            </div>
          </div>

          {/* Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.length === 0 ? (
              <div className={`col-span-full rounded-xl p-12 text-center border-2 border-dashed ${isDark ? "bg-[#1a1d24] border-[#3ecf8e]/20 text-gray-300" : "bg-white border-gray-300 text-gray-600"}`}>
                <div className="text-6xl mb-4">🎯</div>
                <h3 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  No targets yet
                </h3>
                <p className="mb-6 opacity-75">
                  Start by adding your first target website to begin security scanning
                </p>
                <button
                  onClick={handleNewTarget}
                  className="px-6 py-3 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Target
                </button>
              </div>
            ) : (
              targets.map((target) => (
                <div
                  key={target.id}
                  className={`rounded-xl border transition-all hover:shadow-lg overflow-hidden group ${isDark ? "bg-[#1a1d24] border-[#2a2e38] hover:border-[#3ecf8e]/40" : "bg-white border-gray-200 hover:border-[#3ecf8e]"}`}
                >
                  {/* Header dengan gradient subtle */}
                  <div className={`h-1 bg-gradient-to-r from-[#3ecf8e] to-[#2aa866]`}></div>
                  
                  <div className="p-6">
                    {/* Title dan Actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                          {target.name}
                        </h3>

                        <a
                          href={target.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm flex items-center gap-2 hover:opacity-70 transition ${isDark ? "text-[#3ecf8e]" : "text-[#3ecf8e]"}`}
                        >
                          <Globe className="w-4 h-4" />
                          {target.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className={`flex gap-2 p-2 rounded-lg transition ${isDark ? "bg-[#0f1117]/50 group-hover:bg-[#0f1117]" : "bg-gray-50 group-hover:bg-gray-100"}`}>
                        <button
                          onClick={() => handleEdit(target)}
                          className={`p-2 rounded transition ${isDark ? "text-gray-400 hover:text-[#3ecf8e] hover:bg-[#2a2e38]" : "text-gray-600 hover:text-[#3ecf8e] hover:bg-gray-200"}`}
                          title="Edit target"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className={`p-2 rounded transition ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10" : "text-gray-600 hover:text-red-600 hover:bg-red-50"}`}
                          title="Delete target"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {target.description && (
                      <p className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {target.description}
                      </p>
                    )}

                    {/* Tags */}
                    {target.tags && target.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {target.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${isDark ? "bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20" : "bg-[#3ecf8e]/10 text-[#2aa866] border border-[#3ecf8e]/30"}`}
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className={`flex items-center justify-between text-xs mb-4 py-3 px-3 rounded-lg ${isDark ? "bg-[#0f1117]/50" : "bg-gray-50"}`}>
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        📊 {target.scanCount || 0} scans
                      </span>
                      {target.lastScan && (
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                          🕐 {new Date(target.lastScan.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      to="/scan/new"
                      state={{ targetId: target.id, url: target.url }}
                      className="block w-full text-center px-4 py-2.5 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] transition font-semibold"
                    >
                      ▶ Start Scan
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-2xl w-full shadow-2xl border ${isDark ? "bg-[#1a1d24] border-[#2a2e38]" : "bg-white border-gray-200"}`}>
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? "border-[#2a2e38] bg-[#0f1117]/50" : "border-gray-200 bg-gray-50"}`}>
              <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                <Globe className="w-6 h-6 text-[#3ecf8e]" />
                {editingTarget ? "Edit Target" : "Add New Target"}
              </h2>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {editingTarget ? "Update your target information" : "Enter details for your target website"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* URL Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Website URL *
                </label>
                <div className="relative">
                  <Globe className={`absolute left-3 top-3.5 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  Must start with http:// or https://
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Target Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Production Website, Staging App"
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                />
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  A friendly name to identify this target
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Main payment processing system, backend API server"
                  rows="3"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition resize-none ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                />
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  Add notes about this target for future reference
                </p>
              </div>

              {/* Tags Field */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  Tags (Comma Separated, Optional)
                </label>
                <div className="relative">
                  <Tag className={`absolute left-3 top-3.5 w-5 h-5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., production, critical, api, payment"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3ecf8e] focus:border-transparent transition ${isDark ? "bg-[#0f1117] border-[#2a2e38] text-white placeholder-gray-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                  Organize targets with labels (e.g., environment, priority, department)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-6 border-t" style={{borderColor: isDark ? "#2a2e38" : "#e5e7eb"}}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTarget(null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${isDark ? "bg-[#0f1117] text-gray-300 hover:bg-[#2a2e38]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] font-semibold transition"
                >
                  {editingTarget ? "Update Target" : "Add Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Targets;
