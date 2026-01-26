import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { productAPI, orderAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  User,
  Image,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProductById(id);
      setProduct(response.data.product);
    } catch (err) {
      console.error("Failed to fetch product:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const handleOrderClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setShowOrderModal(true);
    setOrderNotes("");
    setOrderError("");
    setOrderSuccess(false);
  };

  const handleSubmitOrder = async () => {
    try {
      setOrderLoading(true);
      setOrderError("");
      
      await orderAPI.createOrder({
        productId: product.id,
        notes: orderNotes,
      });
      
      setOrderSuccess(true);
      setTimeout(() => {
        setShowOrderModal(false);
        navigate("/my-orders");
      }, 2000);
    } catch (err) {
      console.error("Failed to create order:", err);
      setOrderError(err.response?.data?.error || "Failed to create order");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleChatClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (product?.ethack?.id) {
      navigate(`/chat?with=${product.ethack.id}`);
    }
  };

  // Check if user is the owner (can't order own product)
  const isOwner = user?.id === product?.ethackId;

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary} p-6`}>
          <div className="max-w-4xl mx-auto">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <Shield className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h2 className={`text-xl font-semibold ${textPrimary} mb-2`}>Product not found</h2>
              <p className={`${textSecondary} mb-4`}>The service you're looking for doesn't exist.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-[#ffffff] rounded-lg font-medium hover:bg-green-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            to="/products"
            className={`inline-flex items-center gap-2 mb-6 ${textSecondary} hover:text-green-700 transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className={`${bgSecondary} rounded-xl border ${borderColor} overflow-hidden`}>
              {product.imageProduct ? (
                <img
                  src={product.imageProduct}
                  alt={product.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className={`w-full aspect-video flex items-center justify-center ${isDark ? "bg-[#1a1d24]" : "bg-gray-100"}`}>
                  <Image className={`w-24 h-24 ${textSecondary}`} />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>{product.title}</h1>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-700" />
                  <span className="text-3xl font-bold text-green-700">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>

              {/* Ethical Hacker Info */}
              <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4`}>
                <Link
                  to={`/ethical-hackers/${product.ethack?.id}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  {product.ethack?.picture ? (
                    <img
                      src={product.ethack.picture}
                      alt={product.ethack.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>{product.ethack?.name || "Unknown"}</p>
                    <p className={`text-sm ${textSecondary}`}>Ethical Hacker</p>
                  </div>
                </Link>
              </div>

              {/* Description */}
              <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6`}>
                <h2 className={`text-lg font-semibold ${textPrimary} mb-3`}>Description</h2>
                <p className={`${textSecondary} leading-relaxed whitespace-pre-wrap`}>
                  {product.description}
                </p>
              </div>

              {/* Created Date */}
              <div className={`flex items-center gap-2 ${textSecondary}`}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Listed on {new Date(product.createdAt).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {isOwner ? (
                  <div className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl ${isDark ? 'bg-[#1a1d24]' : 'bg-gray-100'} ${textSecondary}`}>
                    <Shield className="w-5 h-5" />
                    This is your service
                  </div>
                ) : (
                  <button 
                    onClick={handleOrderClick}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-700 text-[#ffffff] rounded-xl font-semibold hover:bg-green-600 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5 text-white" />
                    Order Now
                  </button>
                )}
                {!isOwner && (
                  <button 
                    onClick={handleChatClick}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-green-700 text-green-700 font-semibold hover:bg-green-700/10 transition-colors`}
                    title="Chat with Ethical Hacker"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* More Products from same ethack */}
          {product.ethack && (
            <div className="mt-12">
              <h2 className={`text-xl font-semibold ${textPrimary} mb-6`}>
                More from {product.ethack.name}
              </h2>
              <Link
                to={`/ethical-hackers/${product.ethack.id}`}
                className={`inline-flex items-center gap-2 ${textSecondary} hover:text-green-700 transition-colors`}
              >
                View all services
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${bgSecondary} rounded-xl border ${borderColor} max-w-md w-full`}>
            {orderSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-700 mx-auto mb-4" />
                <h2 className={`text-xl font-bold ${textPrimary} mb-2`}>Order Placed!</h2>
                <p className={textSecondary}>Redirecting to your orders...</p>
              </div>
            ) : (
              <>
                <div className={`p-6 border-b ${borderColor}`}>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>Confirm Order</h2>
                </div>
                <div className="p-6">
                  {/* Product Summary */}
                  <div className={`flex items-center gap-4 p-4 rounded-lg ${isDark ? 'bg-[#1a1d24]' : 'bg-gray-50'} mb-4`}>
                    {product.imageProduct ? (
                      <img
                        src={product.imageProduct}
                        alt={product.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2a2e38]' : 'bg-gray-200'}`}>
                        <Image className={`w-8 h-8 ${textSecondary}`} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${textPrimary}`}>{product.title}</h3>
                      <p className={`text-sm ${textSecondary}`}>by {product.ethack?.name}</p>
                      <p className="text-green-700 font-semibold">{formatPrice(product.price)}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      Additional Notes (optional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg ${isDark ? 'bg-[#1a1d24] border-[#2a2e38]' : 'bg-gray-50 border-gray-200'} border ${textPrimary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                      placeholder="Describe your requirements or add any specific notes for the ethical hacker..."
                    />
                  </div>

                  {/* Error */}
                  {orderError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-sm text-red-400">{orderError}</p>
                    </div>
                  )}

                  {/* Info */}
                  <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} mb-4`}>
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                      After ordering, you can chat with the ethical hacker. They will review and accept your order to begin work.
                    </p>
                  </div>
                </div>
                <div className={`p-6 border-t ${borderColor} flex gap-3`}>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className={`flex-1 px-4 py-3 rounded-lg ${isDark ? 'bg-[#1a1d24]' : 'bg-gray-100'} ${textPrimary} font-semibold hover:opacity-80 transition`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderLoading}
                    className="flex-1 px-4 py-3 bg-green-700 text-[#ffffff] rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                  >
                    {orderLoading ? "Processing..." : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ProductDetail;
