import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Check,
} from "lucide-react";

function AdminUsers() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const inputBg = isDark ? "bg-[#1a1d24]" : "bg-gray-50";

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({
        page: pagination.page,
        limit: 10,
        search,
        role: roleFilter,
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEthack = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await userAPI.createEthackUser(formData);
      setSuccess("Ethical hacker created successfully");
      setShowAddModal(false);
      setFormData({ name: "", email: "", password: "" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await userAPI.updateUserRole(userId, newRole);
      setSuccess("User role updated successfully");
      setShowRoleModal(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      setSuccess("User deleted successfully");
      setShowDeleteModal(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      ethack: "bg-green-500/20 text-green-400 border-green-500/30",
      user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
    const labels = {
      admin: "Admin",
      ethack: "Ethical Hacker",
      user: "User",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-3`}>
              <Users className="w-7 h-7 text-green-700" />
              User Management
            </h1>
            <p className={textSecondary}>Manage users, roles, and permissions</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button onClick={() => setError("")} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
              <Check className="w-5 h-5" />
              {success}
              <button onClick={() => setSuccess("")} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4 mb-6`}>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="ethack">Ethical Hacker</option>
                <option value="user">User</option>
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-[#ffffff] rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Ethical Hacker
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className={`${bgSecondary} rounded-xl border ${borderColor} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderColor}`}>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>User</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Email</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Role</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Status</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Last Login</th>
                    <th className={`text-right px-6 py-4 text-sm font-semibold ${textSecondary}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-6 py-12 text-center ${textSecondary}`}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={`border-b ${borderColor} hover:${isDark ? "bg-[#1a1d24]" : "bg-gray-50"}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.picture ? (
                              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <span className={`font-medium ${textPrimary}`}>{user.name}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${textSecondary}`}>{user.email}</td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                          }`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${textSecondary}`}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setShowRoleModal(user)}
                              className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                              title="Change Role"
                            >
                              <Edit2 className="w-4 h-4 text-blue-400" />
                            </button>
                            {user.role !== "admin" && (
                              <button
                                onClick={() => setShowDeleteModal(user)}
                                className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`flex items-center justify-between px-6 py-4 border-t ${borderColor}`}>
                <span className={textSecondary}>
                  Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={textPrimary}>
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Ethack Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${textPrimary}`}>Add Ethical Hacker</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className={`w-5 h-5 ${textSecondary}`} />
                </button>
              </div>
              <form onSubmit={handleAddEthack}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                      required
                    />
                    <p className={`text-xs ${textSecondary} mt-1`}>
                      Min 6 chars with letters, numbers, and special characters
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg border ${borderColor} ${textPrimary} hover:bg-opacity-80`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-700 text-[#0f1117] rounded-lg font-medium hover:bg-green-600"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${textPrimary}`}>Change User Role</h2>
                <button onClick={() => setShowRoleModal(null)}>
                  <X className={`w-5 h-5 ${textSecondary}`} />
                </button>
              </div>
              <p className={`${textSecondary} mb-4`}>
                Select new role for <strong className={textPrimary}>{showRoleModal.name}</strong>
              </p>
              <div className="space-y-2">
                {["user", "ethack", "admin"].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleUpdateRole(showRoleModal.id, role)}
                    disabled={showRoleModal.role === role}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      showRoleModal.role === role
                        ? "border-green-700 bg-green-700/10"
                        : `${borderColor} hover:border-green-700/50`
                    } transition-colors`}
                  >
                    {role === "admin" && <Shield className="w-5 h-5 text-purple-500" />}
                    {role === "ethack" && <UserCheck className="w-5 h-5 text-green-500" />}
                    {role === "user" && <User className="w-5 h-5 text-blue-500" />}
                    <div className="text-left">
                      <span className={`block font-medium ${textPrimary}`}>
                        {role === "admin" ? "Admin" : role === "ethack" ? "Ethical Hacker" : "User"}
                      </span>
                      <span className={`text-xs ${textSecondary}`}>
                        {role === "admin" && "Full access to all features"}
                        {role === "ethack" && "Can create and manage products"}
                        {role === "user" && "Basic user access"}
                      </span>
                    </div>
                    {showRoleModal.role === role && (
                      <Check className="w-5 h-5 text-green-700 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRoleModal(null)}
                className={`w-full mt-4 px-4 py-2 rounded-lg border ${borderColor} ${textPrimary}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>Delete User</h2>
                  <p className={textSecondary}>This action cannot be undone</p>
                </div>
              </div>
              <p className={`${textSecondary} mb-6`}>
                Are you sure you want to delete <strong className={textPrimary}>{showDeleteModal.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${borderColor} ${textPrimary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteModal.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminUsers;
