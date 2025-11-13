import React,{ useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { targetAPI } from "../services/api";
import { useTheme } from '../context/ThemeContext';
import Navbar from "../components/Navbar";
import { ArrowLeft, Plus, Edit2, Trash2, ExternalLink } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No targets yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your first target website
                </p>
                <button
                  onClick={handleNewTarget}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Your First Target
                </button>
              </div>
            ) : (
              targets.map((target) => (
                <div
                  key={target.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {target.name}
                        </h3>

                        <a
                          href={target.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {target.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(target)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {target.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {target.description}
                      </p>
                    )}

                    {/* Tags */}
                    {target.tags && target.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {target.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{target.scanCount || 0} scans</span>
                      {target.lastScan && (
                        <span>
                          Last:{" "}
                          {new Date(
                            target.lastScan.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      to="/new-scan"
                      state={{ targetId: target.id, url: target.url }}
                      className="block w-full text-center px-4 py-2 bg-[#3ecf8e] text-black rounded-lg hover:bg-[#52ffb2] transition font-medium"
                    >
                      Start Scan
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTarget ? "Edit Target" : "Add New Target"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Production Website"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="production, critical, wordpress"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTarget(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTarget ? "Update" : "Add"} Target
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
