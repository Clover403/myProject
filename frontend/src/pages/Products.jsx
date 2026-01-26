import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { productAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  Package,
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Image,
  User,
} from "lucide-react";

function Products() {
  const { isDark } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

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
      const response = await productAPI.getAllProducts({
        page: pagination.page,
        limit: 12,
        search,
      });
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products:", err);
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

  return (
    <Layout>
      <div className={`min-h-screen ${bgPrimary} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-2xl font-bold ${textPrimary} flex items-center gap-3`}>
              <Package className="w-7 h-7 text-green-700" />
              Security Services
            </h1>
            <p className={textSecondary}>
              Browse professional security services from our ethical hackers
            </p>
          </div>

          {/* Search */}
          <div className={`${bgSecondary} rounded-xl border ${borderColor} p-4 mb-6`}>
            <div className="relative max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`w-full pl-10 pr-4 py-2 rounded-lg ${inputBg} border ${borderColor} ${textPrimary} focus:outline-none focus:border-green-700`}
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : products.length === 0 ? (
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <Package className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No services available</h3>
              <p className={textSecondary}>Check back later for new security services</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className={`${bgSecondary} rounded-xl border ${borderColor} overflow-hidden transition-all hover:border-green-700/50 hover:shadow-lg hover:shadow-green-700/5 group`}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-video overflow-hidden">
                      {product.imageProduct ? (
                        <img
                          src={product.imageProduct}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDark ? "bg-[#1a1d24]" : "bg-gray-100"}`}>
                          <Image className={`w-12 h-12 ${textSecondary}`} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className={`text-lg font-semibold ${textPrimary} mb-1 line-clamp-1 group-hover:text-green-700 transition-colors`}>
                        {product.title}
                      </h3>
                      
                      {/* Ethack Info */}
                      <div className="flex items-center gap-2 mb-3">
                        {product.ethack?.picture ? (
                          <img
                            src={product.ethack.picture}
                            alt={product.ethack.name}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                            <User className="w-3 h-3" />
                          </div>
                        )}
                        <span className={`text-sm ${textSecondary}`}>
                          {product.ethack?.name || "Unknown"}
                        </span>
                      </div>

                      <p className={`text-sm ${textSecondary} mb-3 line-clamp-2`}>
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-700">
                          {formatPrice(product.price)}
                        </span>
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-green-700/10 text-green-700 rounded-lg text-sm font-medium hover:bg-green-700/20 transition-colors">
                          <ShoppingCart className="w-4 h-4" />
                          Order
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={`flex items-center justify-center gap-4 mt-8`}>
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

export default Products;
