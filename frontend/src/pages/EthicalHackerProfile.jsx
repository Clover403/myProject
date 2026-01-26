import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { userAPI, productAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  User,
  Shield,
  Package,
  Calendar,
  ShoppingCart,
  Image,
  Users,
} from "lucide-react";

function EthicalHackerProfile() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [hacker, setHacker] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme styles
  const bgPrimary = isDark ? "bg-[#0f1117]" : "bg-gray-50";
  const bgSecondary = isDark ? "bg-[#151822]" : "bg-white";
  const borderColor = isDark ? "border-[#1f2330]" : "border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  useEffect(() => {
    fetchHackerProfile();
  }, [id]);

  const fetchHackerProfile = async () => {
    try {
      setLoading(true);
      const [hackerRes, productsRes] = await Promise.all([
        userAPI.getEthicalHackerProfile(id),
        productAPI.getProductsByEthack(id),
      ]);
      setHacker(hackerRes.data.ethicalHacker);
      setProducts(productsRes.data.products);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
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

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </Layout>
    );
  }

  if (!hacker) {
    return (
      <Layout>
        <div className={`min-h-screen ${bgPrimary} p-6`}>
          <div className="max-w-4xl mx-auto">
            <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${textSecondary}`} />
              <h2 className={`text-xl font-semibold ${textPrimary} mb-2`}>Ethical hacker not found</h2>
              <p className={`${textSecondary} mb-4`}>The profile you're looking for doesn't exist.</p>
              <Link
                to="/ethical-hackers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-[#0f1117] rounded-lg font-medium hover:bg-[#34b379]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Ethical Hackers
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
            to="/ethical-hackers"
            className={`inline-flex items-center gap-2 mb-6 ${textSecondary} hover:text-green-700 transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Ethical Hackers
          </Link>

          {/* Profile Header */}
          <div className={`${bgSecondary} rounded-xl border ${borderColor} p-6 mb-8`}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              {hacker.picture ? (
                <img
                  src={hacker.picture}
                  alt={hacker.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-green-700/20"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ring-4 ring-green-700/20 ${isDark ? "bg-[#2a2e38]" : "bg-gray-200"}`}>
                  <User className={`w-12 h-12 ${textSecondary}`} />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className={`text-2xl font-bold ${textPrimary} mb-2`}>{hacker.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  <Shield className="w-5 h-5 text-green-700" />
                  <span className="text-green-700 font-medium">Verified Ethical Hacker</span>
                </div>
                <div className={`flex flex-wrap items-center justify-center md:justify-start gap-4 ${textSecondary}`}>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{products.length} Services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Member since {new Date(hacker.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h2 className={`text-xl font-semibold ${textPrimary} mb-6 flex items-center gap-2`}>
              <Package className="w-5 h-5 text-green-700" />
              Services Offered
            </h2>

            {products.length === 0 ? (
              <div className={`${bgSecondary} rounded-xl border ${borderColor} p-12 text-center`}>
                <Package className={`w-12 h-12 mx-auto mb-4 ${textSecondary}`} />
                <p className={textSecondary}>No services available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <h3 className={`text-lg font-semibold ${textPrimary} mb-2 line-clamp-1 group-hover:text-green-700 transition-colors`}>
                        {product.title}
                      </h3>
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EthicalHackerProfile;
