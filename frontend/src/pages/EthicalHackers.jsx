import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Shield,
  ArrowRight,
} from "lucide-react";

function EthicalHackers() {
  const { isDark } = useTheme();
  const [hackers, setHackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    fetchHackers();
  }, [pagination.page]);

  const fetchHackers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllEthicalHackers({
        page: pagination.page,
        limit: 12,
      });
      setHackers(response.data.ethicalHackers);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to fetch ethical hackers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-3`}>
              <Users className="w-7 h-7 text-green-700" />
              Ethical Hackers
            </h1>
            <p className={textSecondary}>
              Connect with certified security professionals
            </p>
          </div>

          {/* Hackers Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : hackers.length === 0 ? (
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No ethical hackers available</h3>
              <p className={textSecondary}>Check back later for security professionals</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {hackers.map((hacker) => (
                  <Link
                    key={hacker.id}
                    to={`/ethical-hackers/${hacker.id}`}
                    className={`${bgSecondary} rounded-xl border ${borderColor} p-6 transition-all hover:border-green-700/50 hover:shadow-lg hover:shadow-green-700/5 group`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      {hacker.picture ? (
                        <img
                          src={hacker.picture}
                          alt={hacker.name}
                          className="w-20 h-20 rounded-full object-cover mb-4 ring-2 ring-green-700/20 group-hover:ring-green-700/50 transition-all"
                        />
                      ) : (
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-2 ring-green-700/20 group-hover:ring-green-700/50 transition-all ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                          <User className={`w-10 h-10 ${textSecondary}`} />
                        </div>
                      )}

                      {/* Name */}
                      <h3 className={`text-lg font-semibold ${textPrimary} mb-1 group-hover:text-green-700 transition-colors`}>
                        {hacker.name}
                      </h3>

                      {/* Badge */}
                      <div className="flex items-center gap-1 mb-4">
                        <Shield className="w-4 h-4 text-green-700" />
                        <span className="text-sm text-green-700 font-medium">Ethical Hacker</span>
                      </div>

                      {/* Product Count */}
                      <div className={`flex items-center gap-2 ${textSecondary}`}>
                        <Package className="w-4 h-4" />
                        <span className="text-sm">{hacker.productCount || 0} Services</span>
                      </div>

                      {/* CTA */}
                      <div className={`mt-4 flex items-center gap-1 text-sm ${textSecondary} group-hover:text-green-700 transition-colors`}>
                        View Profile
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${bgSecondary} border ${borderColor} ${textPrimary} disabled:opacity-50 disabled:cursor-not-allowed hover:border-green-700/50`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className={textSecondary}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${bgSecondary} border ${borderColor} ${textPrimary} disabled:opacity-50 disabled:cursor-not-allowed hover:border-green-700/50`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EthicalHackers;
