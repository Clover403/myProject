import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { productAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  DollarSign,
  Image,
} from "lucide-react";

function AdminProducts() {
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    imageProduct: "",
  });
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
    fetchProducts();
  }, [search, pagination.page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.adminGetAllProducts({
        page: pagination.page,
        limit: 10,
        search,
      });
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (showEditModal) {
        await productAPI.updateProduct(showEditModal.id, formData);
        setSuccess("Product updated successfully");
        setShowEditModal(null);
      } else {
        await productAPI.createProduct(formData);
        setSuccess("Product created successfully");
        setShowAddModal(false);
      }
      setFormData({ title: "", description: "", price: "", imageProduct: "" });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      imageProduct: product.imageProduct || "",
    });
    setShowEditModal(product);
  };

  const handleDelete = async (productId) => {
    try {
      await productAPI.deleteProduct(productId);
      setSuccess("Product deleted successfully");
      setShowDeleteModal(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete product");
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await productAPI.updateProduct(product.id, { isActive: !product.isActive });
      setSuccess(`Product ${product.isActive ? "deactivated" : "activated"} successfully`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product status");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-3`}>
              <Package className="w-7 h-7 text-green-700" />
              Product Management
            </h1>
            <p className={textSecondary}>Manage all ethical hacker products and services</p>
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
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                />
              </div>
              <button
                onClick={() => {
                  setFormData({ title: "", description: "", price: "", imageProduct: "" });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-[#ffffff] rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className={`${bgSecondary} rounded-xl border ${borderColor} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderColor}`}>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Product</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Ethical Hacker</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Price</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Status</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${textSecondary}`}>Created</th>
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
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-6 py-12 text-center ${textSecondary}`}>
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className={`border-b ${borderColor} hover:${isDark ? "bg-[#1a1d24]" : "bg-gray-50"}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.imageProduct ? (
                              <img
                                src={product.imageProduct}
                                alt={product.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                                <Image className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <span className={`block font-medium ${textPrimary}`}>{product.title}</span>
                              <span className={`text-sm ${textSecondary} line-clamp-1`}>
                                {product.description.substring(0, 50)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${textSecondary}`}>
                          {product.ethack?.name || "Unknown"}
                        </td>
                        <td className={`px-6 py-4 font-medium ${textPrimary}`}>
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${textSecondary}`}>
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(product)}
                              className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                              title={product.isActive ? "Deactivate" : "Activate"}
                            >
                              {product.isActive ? (
                                <EyeOff className="w-4 h-4 text-green-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(product)}
                              className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
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

        {/* Add/Edit Product Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${textPrimary}`}>
                  {showEditModal ? "Edit Product" : "Add New Product"}
                </h2>
                <button onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(null);
                }}>
                  <X className={`w-5 h-5 ${textSecondary}`} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className={`w-full px-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700 resize-none`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Price (IDR)</label>
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Image URL</label>
                    <div className="relative">
                      <Image className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                      <input
                        type="url"
                        value={formData.imageProduct}
                        onChange={(e) => setFormData({ ...formData, imageProduct: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    {formData.imageProduct && (
                      <div className="mt-2">
                        <img
                          src={formData.imageProduct}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border ${borderColor} ${textPrimary} hover:bg-opacity-80`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-700 text-[#0f1117] rounded-lg font-medium hover:bg-green-600"
                  >
                    {showEditModal ? "Update" : "Create"}
                  </button>
                </div>
              </form>
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
                  <h2 className={`text-xl font-bold ${textPrimary}`}>Delete Product</h2>
                  <p className={textSecondary}>This action cannot be undone</p>
                </div>
              </div>
              <p className={`${textSecondary} mb-6`}>
                Are you sure you want to delete <strong className={textPrimary}>{showDeleteModal.title}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${borderColor} ${textPrimary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal.id)}
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

export default AdminProducts;
