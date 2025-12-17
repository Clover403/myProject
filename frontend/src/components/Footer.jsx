import React from "react";
import { useTheme } from "../context/ThemeContext";
import { ShieldCheck, Mail, Phone } from "lucide-react";

function Footer() {
  const { isDark } = useTheme();

  return (
    <footer
      className={`border-t ${
        isDark
          ? "border-[#1a1d24] bg-[#0f1117]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isDark ? "bg-[#3ecf8e]/10" : "bg-green-100"}`}>
                <ShieldCheck className="w-6 h-6 text-[#3ecf8e]" />
              </div>
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                CloverSecurity — Web Defense Refined
              </h2>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Kami membantu tim modern menjaga aplikasi web tetap terlindungi dengan pemindaian OWASP ZAP real-time, intel remediation yang jelas, dan panduan keamanan yang selalu terjaga. Bangun kepercayaan pelanggan dengan standar keamanan terbaik.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className={`text-sm font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Kontak Keamanan
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:travclover@gmail.com"
                className={`flex items-center gap-3 text-sm transition-colors ${
                  isDark
                    ? "text-gray-300 hover:text-[#3ecf8e]"
                    : "text-gray-700 hover:text-[#3ecf8e]"
                }`}
              >
                <Mail className="w-4 h-4" />
                travclover@gmail.com
              </a>
              <a
                href="https://wa.me/62897503666"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 text-sm transition-colors ${
                  isDark
                    ? "text-gray-300 hover:text-[#3ecf8e]"
                    : "text-gray-700 hover:text-[#3ecf8e]"
                }`}
              >
                <Phone className="w-4 h-4" />
                0897 503 666
              </a>
            </div>
          </div>
        </div>

        <div className={`mt-10 pt-6 border-t ${isDark ? "border-[#1a1d24]" : "border-gray-200"}`}>
          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
            © {new Date().getFullYear()} CloverSecurity. Semua hak dilindungi. Keamanan bukan fitur tambahan—ini adalah fondasi bisnis Anda.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
