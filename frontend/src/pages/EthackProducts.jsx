import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { productAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Check,
  DollarSign,
  Image,
  ShoppingBag,
} from "lucide-react";

function EthackProducts() {
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getMyProducts();
      setProducts(response.data.products);
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-3`}>
                <Package className="w-7 h-7 text-green-700" />
                My Products
              </h1>
              <p className={textSecondary}>Manage your security service offerings</p>
            </div>
            <button
              onClick={() => {
                setFormData({ title: "", description: "", price: "", imageProduct: "" });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
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

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : products.length === 0 ? (
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <ShoppingBag className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No products yet</h3>
              <p className={`${textSecondary} mb-4`}>
                Start by creating your first security service product
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`${bgSecondary} rounded-xl border ${borderColor} overflow-hidden transition-all hover:border-green-700/30`}
                >
                  {/* Product Image */}
                  <div className="relative aspect-video">
                    {product.imageProduct ? (
                      <img
                        src={product.imageProduct}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-[#1a1d24]" : "bg-gray-100"}`}>
                        <Image className={`w-12 h-12 ${textSecondary}`} />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.isActive
                          ? "bg-green-500/90 text-white"
                          : "bg-red-500/90 text-white"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className={`text-lg font-semibold ${textPrimary} mb-2 line-clamp-1`}>
                      {product.title}
                    </h3>
                    <p className={`text-sm ${textSecondary} mb-3 line-clamp-2`}>
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold text-green-700`}>
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          {product.isActive ? (
                            <EyeOff className="w-4 h-4 text-green-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(product)}
                          className={`p-2 rounded-lg ${isDark ? "hover:bg-[#2a2e38]" : "hover:bg-gray-100"} transition-colors`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      placeholder="e.g., Web Penetration Testing"
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
                      placeholder="Describe your service in detail..."
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
                        placeholder="500000"
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
                    className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600"
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

export default EthackProducts;
