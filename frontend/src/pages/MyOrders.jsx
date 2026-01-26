import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { orderAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageCircle,
  Eye,
  Star,
  User,
  Calendar,
  CreditCard,
  Download,
  FileText,
  DollarSign
} from "lucide-react";

function MyOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("details"); // details, revision, review
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [paymentNotification, setPaymentNotification] = useState(null);

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const bgTertiary = isDark ? "bg-[#1a1d24]" : "bg-gray-100";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  // Check for payment callback params
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      setPaymentNotification({ type: 'success', message: 'Payment successful! The seller will start working on your order.' });
    } else if (payment === 'error') {
      setPaymentNotification({ type: 'error', message: 'Payment failed. Please try again.' });
    } else if (payment === 'pending') {
      setPaymentNotification({ type: 'warning', message: 'Payment is pending. Please complete your payment.' });
    }
    
    // Clear notification after 5 seconds
    if (payment) {
      setTimeout(() => setPaymentNotification(null), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await orderAPI.getMyOrders(params);
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (order) => {
    try {
      setActionLoading(true);
      const response = await orderAPI.initiatePayment(order.id);
      
      if (response.data.payment?.redirectUrl) {
        // Open Midtrans payment page
        window.open(response.data.payment.redirectUrl, '_blank');
      }
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      alert(err.response?.data?.error || "Failed to initiate payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await orderAPI.completeOrder(orderId, { review, rating });
      fetchOrders();
      setShowModal(false);
      setSelectedOrder(null);
      setReview("");
      setRating(5);
    } catch (err) {
      console.error("Failed to complete order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (orderId) => {
    if (!revisionNotes.trim()) return;
    try {
      setActionLoading(true);
      await orderAPI.requestRevision(orderId, revisionNotes);
      fetchOrders();
      setShowModal(false);
      setSelectedOrder(null);
      setRevisionNotes("");
    } catch (err) {
      console.error("Failed to request revision:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      setActionLoading(true);
      await orderAPI.cancelOrder(orderId);
      fetchOrders();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, paymentStatus, sellerIsOnJob) => {
    const badges = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
        text: sellerIsOnJob ? "Ethack is on another job" : "Waiting for acceptance"
      },
      waiting_payment: {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: CreditCard,
        text: "Waiting for Payment"
      },
      on_process: {
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icon: RefreshCw,
        text: "On Process"
      },
      submitted: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: Package,
        text: "Submitted - Review Required"
      },
      revision: {
        color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icon: RefreshCw,
        text: "Revision Requested"
      },
      completed: {
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: CheckCircle,
        text: "Completed"
      },
      rejected: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: XCircle,
        text: "Rejected"
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const filterButtons = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "waiting_payment", label: "Payment" },
    { value: "on_process", label: "On Process" },
    { value: "submitted", label: "Submitted" },
    { value: "completed", label: "Completed" },
  ];

  const openRevisionModal = (order) => {
    setSelectedOrder(order);
    setModalType("revision");
    setShowModal(true);
  };

  const openReviewModal = (order) => {
    setSelectedOrder(order);
    setModalType("review");
    setShowModal(true);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setModalType("details");
    setShowModal(true);
  };

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Payment Notification */}
          {paymentNotification && (
            <div className={`mb-6 p-4 rounded-lg ${
              paymentNotification.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
              paymentNotification.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
              'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
            }`}>
              {paymentNotification.message}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${textPrimary}`}>My Orders</h1>
              <p className={textSecondary}>Track your service orders</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={`flex flex-wrap gap-2 mb-6 p-2 ${bgSecondary} rounded-xl border ${borderColor}`}>
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === btn.value
                    ? "bg-green-700 text-white"
                    : `${textSecondary} hover:${bgTertiary}`
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <Package className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h2 className={`text-xl font-semibold ${textPrimary} mb-2`}>No orders found</h2>
              <p className={textSecondary}>You haven't placed any orders yet.</p>
              <Link
                to="/products"
                className="inline-block mt-4 px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`${bgSecondary} rounded-xl border ${borderColor} p-6`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Product Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {order.product?.imageProduct ? (
                        <img
                          src={order.product.imageProduct}
                          alt={order.product.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${bgTertiary}`}>
                          <Package className={`w-8 h-8 ${textSecondary}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${textPrimary} mb-1`}>
                          {order.product?.title || "Unknown Product"}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          {order.seller?.picture ? (
                            <img src={order.seller.picture} alt={order.seller.name} className="w-5 h-5 rounded-full" />
                          ) : (
                            <User className={`w-5 h-5 ${textSecondary}`} />
                          )}
                          <span className={`text-sm ${textSecondary}`}>{order.seller?.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-700 font-semibold">{formatPrice(order.price)}</span>
                          <span className={textSecondary}>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(order.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {getStatusBadge(order.status, order.paymentStatus, order.seller?.isOnJob)}
                      
                      <div className="flex gap-2">
                        {/* Chat with seller */}
                        <button
                          onClick={() => navigate(`/chat?with=${order.sellerId}`)}
                          className={`p-2 rounded-lg ${bgTertiary} ${textSecondary} hover:text-green-700 transition`}
                          title="Chat with seller"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* View details */}
                        <button
                          onClick={() => openDetailsModal(order)}
                          className={`p-2 rounded-lg ${bgTertiary} ${textSecondary} hover:text-green-700 transition`}
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* Cancel button (only for pending or waiting_payment) */}
                        {(order.status === "pending" || order.status === "waiting_payment") && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className={`p-2 rounded-lg ${bgTertiary} text-red-400 hover:text-red-300 transition`}
                            title="Cancel order"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}

                        {/* Pay Now button for waiting_payment */}
                        {order.status === "waiting_payment" && (
                          <button
                            onClick={() => handlePayment(order)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </button>
                        )}

                        {/* Action buttons for submitted orders */}
                        {order.status === "submitted" && (
                          <>
                            <button
                              onClick={() => openReviewModal(order)}
                              className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => openRevisionModal(order)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                            >
                              Revision
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className={`mt-4 p-3 ${bgTertiary} rounded-lg`}>
                      <p className={`text-sm ${textSecondary}`}>
                        <span className="font-medium">Notes:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Submitted File */}
                  {order.status === "submitted" && order.submittedFileUrl && (
                    <div className={`mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">
                          {order.submittedFileName || 'Deliverable'}
                        </span>
                      </div>
                      <a
                        href={order.submittedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  )}

                  {/* Submit Notes */}
                  {order.status === "submitted" && order.submitNotes && (
                    <div className={`mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg`}>
                      <p className="text-sm text-green-400">
                        <span className="font-medium">Seller Notes:</span> {order.submitNotes}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {order.status === "rejected" && order.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">
                        <span className="font-medium">Rejection Reason:</span> {order.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Revision Notes */}
                  {order.status === "revision" && order.revisionNotes && (
                    <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-sm text-orange-400">
                        <span className="font-medium">Your Revision Request:</span> {order.revisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${bgSecondary} rounded-xl border ${borderColor} max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <h2 className={`text-xl font-bold ${textPrimary}`}>
                {modalType === "revision" ? "Request Revision" :
                 modalType === "review" ? "Accept & Review" : "Order Details"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Common Info */}
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Product</label>
                <p className={textPrimary}>{selectedOrder.product?.title}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Price</label>
                <p className="text-green-700 font-semibold">{formatPrice(selectedOrder.price)}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Status</label>
                {getStatusBadge(selectedOrder.status, selectedOrder.paymentStatus)}
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Seller</label>
                <p className={textPrimary}>{selectedOrder.seller?.name}</p>
              </div>

              {/* Payment Info */}
              {selectedOrder.paidAt && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Paid At</label>
                  <p className={textPrimary}>{new Date(selectedOrder.paidAt).toLocaleString("id-ID")}</p>
                </div>
              )}

              {/* Submitted File in Details */}
              {modalType === "details" && selectedOrder.submittedFileUrl && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Deliverable</label>
                  <a
                    href={selectedOrder.submittedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-700 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    {selectedOrder.submittedFileName || 'Download File'}
                  </a>
                </div>
              )}

              {/* Revision Form */}
              {modalType === "revision" && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                    Describe what changes you need
                  </label>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg ${bgTertiary} border ${borderColor} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                    placeholder="Describe what changes you need..."
                  />
                </div>
              )}

              {/* Review Form */}
              {modalType === "review" && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : textSecondary}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                      Review (optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg ${bgTertiary} border ${borderColor} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                      placeholder="Share your experience..."
                    />
                  </div>
                </>
              )}
            </div>
            <div className={`p-6 border-t ${borderColor} flex gap-3`}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                  setRevisionNotes("");
                  setReview("");
                  setRating(5);
                }}
                className={`flex-1 px-4 py-3 rounded-lg ${bgTertiary} ${textPrimary} font-semibold hover:opacity-80 transition`}
              >
                {modalType === "details" ? "Close" : "Cancel"}
              </button>
              
              {modalType === "revision" && (
                <button
                  onClick={() => handleRequestRevision(selectedOrder.id)}
                  disabled={!revisionNotes.trim() || actionLoading}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Request Revision"}
                </button>
              )}
              
              {modalType === "review" && (
                <button
                  onClick={() => handleCompleteOrder(selectedOrder.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Accept & Complete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MyOrders;
