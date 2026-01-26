import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { orderAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  User,
  Calendar,
  Send,
  Briefcase
} from "lucide-react";

function SellerOrders() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sellerStatus, setSellerStatus] = useState({ isOnJob: false, currentOrderId: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const bgTertiary = isDark ? "bg-[#1a1d24]" : "bg-gray-100";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await orderAPI.getSellerOrders(params);
      setOrders(response.data.orders || []);
      setSellerStatus(response.data.sellerStatus || { isOnJob: false, currentOrderId: null });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await orderAPI.acceptOrder(orderId);
      fetchOrders();
    } catch (err) {
      console.error("Failed to accept order:", err);
      alert(err.response?.data?.error || "Failed to accept order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await orderAPI.rejectOrder(selectedOrder.id, rejectReason);
      fetchOrders();
      setShowRejectModal(false);
      setSelectedOrder(null);
      setRejectReason("");
    } catch (err) {
      console.error("Failed to reject order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await orderAPI.submitOrder(selectedOrder.id, submitNotes);
      fetchOrders();
      setShowSubmitModal(false);
      setSelectedOrder(null);
      setSubmitNotes("");
    } catch (err) {
      console.error("Failed to submit work:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    const badges = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
        text: "Pending Approval"
      },
      waiting_payment: {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: Clock,
        text: "Waiting Payment"
      },
      on_process: {
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icon: RefreshCw,
        text: "Working"
      },
      submitted: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: Send,
        text: "Submitted"
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
    { value: "waiting_payment", label: "Waiting Payment" },
    { value: "on_process", label: "Working" },
    { value: "submitted", label: "Submitted" },
    { value: "revision", label: "Revision" },
    { value: "completed", label: "Completed" },
  ];

  const pendingOrders = orders.filter(o => o.status === "pending");
  const waitingPaymentOrders = orders.filter(o => o.status === "waiting_payment");
  const activeOrders = orders.filter(o => ["on_process", "revision"].includes(o.status));

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Header with Status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${textPrimary}`}>Incoming Orders</h1>
              <p className={textSecondary}>Manage your service orders</p>
            </div>
            <div className={`mt-4 md:mt-0 ${bgSecondary} rounded-xl border ${borderColor} px-4 py-3`}>
              {sellerStatus.isOnJob ? (
                <div className="flex items-center gap-2 text-purple-400">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">Currently working on a job</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Available for new orders</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textPrimary}`}>{pendingOrders.length}</p>
                  <p className={`text-sm ${textSecondary}`}>Pending</p>
                </div>
              </div>
            </div>
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textPrimary}`}>{activeOrders.length}</p>
                  <p className={`text-sm ${textSecondary}`}>Active</p>
                </div>
              </div>
            </div>
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Send className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textPrimary}`}>
                    {orders.filter(o => o.status === "submitted").length}
                  </p>
                  <p className={`text-sm ${textSecondary}`}>Submitted</p>
                </div>
              </div>
            </div>
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textPrimary}`}>
                    {orders.filter(o => o.status === "completed").length}
                  </p>
                  <p className={`text-sm ${textSecondary}`}>Completed</p>
                </div>
              </div>
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
                    ? "bg-green-700 text-[#ffffff]"
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
              <p className={textSecondary}>You don't have any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`${bgSecondary} rounded-xl border ${borderColor} p-6 ${
                    sellerStatus.currentOrderId === order.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  {sellerStatus.currentOrderId === order.id && (
                    <div className="mb-4 px-3 py-1 bg-purple-500/20 rounded-lg inline-flex items-center gap-2 text-purple-400 text-sm">
                      <Briefcase className="w-4 h-4" />
                      Current Active Job
                    </div>
                  )}
                  
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
                          <span className={`text-sm ${textSecondary}`}>Buyer:</span>
                          {order.buyer?.picture ? (
                            <img src={order.buyer.picture} alt={order.buyer.name} className="w-5 h-5 rounded-full" />
                          ) : (
                            <User className={`w-5 h-5 ${textSecondary}`} />
                          )}
                          <span className={`text-sm font-medium ${textPrimary}`}>{order.buyer?.name}</span>
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
                      {getStatusBadge(order.status, order.paymentStatus)}
                      
                      <div className="flex gap-2">
                        {/* Chat with buyer */}
                        <button
                          onClick={() => navigate(`/chat?with=${order.buyerId}`)}
                          className={`p-2 rounded-lg ${bgTertiary} ${textSecondary} hover:text-green-700 transition`}
                          title="Chat with buyer"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Accept/Reject for pending orders */}
                        {order.status === "pending" && !sellerStatus.isOnJob && (
                          <>
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-[#34b379] transition disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Waiting payment status */}
                        {order.status === "waiting_payment" && (
                          <span className={`px-4 py-2 ${bgTertiary} rounded-lg text-blue-400`}>
                            Waiting for buyer payment
                          </span>
                        )}

                        {/* Submit button for on_process or revision */}
                        {(order.status === "on_process" || order.status === "revision") && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowSubmitModal(true);
                            }}
                            className="px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-[#34b379] transition"
                          >
                            Submit Work
                          </button>
                        )}

                        {/* Waiting for review */}
                        {order.status === "submitted" && (
                          <span className={`px-4 py-2 ${bgTertiary} rounded-lg ${textSecondary}`}>
                            Waiting for buyer review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className={`mt-4 p-3 ${bgTertiary} rounded-lg`}>
                      <p className={`text-sm ${textSecondary}`}>
                        <span className="font-medium">Buyer Notes:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Revision Notes */}
                  {order.status === "revision" && order.revisionNotes && (
                    <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-sm text-orange-400">
                        <span className="font-medium">Revision Request:</span> {order.revisionNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${bgSecondary} rounded-xl border ${borderColor} max-w-md w-full`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <h2 className={`text-xl font-bold ${textPrimary}`}>Reject Order</h2>
            </div>
            <div className="p-6">
              <p className={`${textSecondary} mb-4`}>
                Are you sure you want to reject this order from {selectedOrder.buyer?.name}?
              </p>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg ${bgTertiary} border ${borderColor} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className={`p-6 border-t ${borderColor} flex gap-3`}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedOrder(null);
                  setRejectReason("");
                }}
                className={`flex-1 px-4 py-3 rounded-lg ${bgTertiary} ${textPrimary} font-semibold hover:opacity-80 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${bgSecondary} rounded-xl border ${borderColor} max-w-md w-full`}>
            <div className={`p-6 border-b ${borderColor}`}>
              <h2 className={`text-xl font-bold ${textPrimary}`}>Submit Work</h2>
            </div>
            <div className="p-6">
              <p className={`${textSecondary} mb-4`}>
                Submit your completed work for "{selectedOrder.product?.title}"
              </p>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Delivery Notes (optional)
              </label>
              <textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg ${bgTertiary} border ${borderColor} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-green-700/50`}
                placeholder="Add any notes about your delivery..."
              />
            </div>
            <div className={`p-6 border-t ${borderColor} flex gap-3`}>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedOrder(null);
                  setSubmitNotes("");
                }}
                className={`flex-1 px-4 py-3 rounded-lg ${bgTertiary} ${textPrimary} font-semibold hover:opacity-80 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-green-700 text-[#0f1117] rounded-lg font-semibold hover:bg-[#34b379] transition disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Submit Work"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default SellerOrders;
