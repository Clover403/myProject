import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronRight,
  Scan,
  Users,
  GraduationCap,
  Target,
  Bug,
  FileSearch,
  Cpu,
  Network,
  Lock,
  Eye,
  Fingerprint,
  Code,
  Terminal,
  Database,
  Cloud,
  Laptop,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X
} from 'lucide-react';
import { useSelector } from 'react-redux';

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090b0e] text-gray-300 font-sans selection:bg-[#3ecf8e] selection:text-[#090b0e]">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#090b0e]/90 backdrop-blur-md border-b border-[#1c1f26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img 
                src="/file_000000001d206246bd4f17ee6a946aa9.png" 
                alt="CloverGuard Logo" 
                className="w-8 h-8 object-contain rounded-full"
              />
              <span className="text-lg font-semibold text-white tracking-tight">CloverGuard</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Products</a>
              <a href="#services" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Services</a>
              <a href="#learning" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Learning</a>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="hidden sm:flex px-4 py-2 rounded-md bg-[#3ecf8e] text-[#090b0e] text-sm font-medium hover:bg-[#34b379] transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/login" 
                    className="hidden sm:flex px-4 py-2 rounded-md bg-[#3ecf8e] text-[#090b0e] text-sm font-medium hover:bg-[#34b379] transition-all"
                  >
                    Start check
                  </Link>
                </>
              )}
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d0f14] border-t border-[#1c1f26]">
            <div className="px-4 py-4 space-y-2">
              <a href="#features" className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Products</a>
              <a href="#services" className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Services</a>
              <a href="#learning" className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Learning</a>
              <a href="#pricing" className="block px-4 py-2 text-sm text-gray-400 hover:text-white">Pricing</a>
              <div className="pt-4 border-t border-[#1c1f26]">
                <Link to="/login" className="block w-full px-4 py-2 text-center rounded-md bg-[#3ecf8e] text-[#090b0e] text-sm font-medium">
                  Start your project
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight mb-6 leading-tight">
            Build secure apps<br />
            <span className="text-[#3ecf8e]">Scale with confidence</span>
          </h1>
          
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            CloverGuard is the complete security platform for your applications.
            Start with vulnerability scanning, AI-powered analysis, expert cyber team, 
            and comprehensive security learning resources.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#3ecf8e] text-[#090b0e] font-medium hover:bg-[#34b379] transition-all"
            >
              Start check now
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#1c1f26] text-white font-medium hover:bg-[#252932] border border-[#2a2e38] transition-all"
            >
              Request a demo
            </a>
          </div>

          {/* Trusted by section */}
          <div className="mt-20 pt-10 border-t border-[#1c1f26]">
            <p className="text-sm text-gray-600 mb-8">Trusted by security-conscious teams worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-50">
              <div className="flex items-center gap-2 text-gray-400">
                <Cloud className="w-5 h-5" />
                <span className="font-semibold">TechCorp</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Database className="w-5 h-5" />
                <span className="font-semibold">DataFlow</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Github className="w-5 h-5" />
                <span className="font-semibold">OpenDev</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Laptop className="w-5 h-5" />
                <span className="font-semibold">SecureApp</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Network className="w-5 h-5" />
                <span className="font-semibold">NetGuard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid - Supabase Style */}
      <section id="features" className="py-16 lg:py-24 bg-[#090b0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Security Scan - Large Card */}
            <div className="lg:row-span-2 rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <Scan className="w-5 h-5 text-[#3ecf8e]" />
                <h3 className="text-white font-medium">Security Scan</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Comprehensive <span className="text-white">vulnerability scanning</span> for your web applications, 
                APIs, and infrastructure with real-time threat detection.
              </p>
              
              {/* Scan Visualization */}
              <div className="relative h-48 bg-[#090b0e] rounded-lg border border-[#1c1f26] overflow-hidden mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-[#3ecf8e]/20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full border-2 border-[#3ecf8e]/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#3ecf8e]/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-[#3ecf8e]" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-[#3ecf8e] to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  <div className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">3 Critical</div>
                  <div className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">7 Medium</div>
                  <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">12 Low</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3ecf8e]" />
                  <span>OWASP Top 10 Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3ecf8e]" />
                  <span>Real-time Monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3ecf8e]" />
                  <span>AI-Powered Analysis</span>
                </div>
              </div>
            </div>

            {/* Cyber Team Card */}
            <div className="rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-medium">Cyber Security Team</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Access to <span className="text-white">expert security professionals</span> for penetration testing and security consulting.
              </p>
              
              {/* Team Avatars */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3ecf8e]/30 to-[#3ecf8e]/10 border-2 border-[#0d0f14] flex items-center justify-center">
                      <span className="text-xs text-[#3ecf8e]">{['A', 'B', 'C', 'D'][i]}</span>
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">+12 experts</span>
              </div>
            </div>

            {/* Learning Card */}
            <div className="rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-medium">Security Learning</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Comprehensive <span className="text-white">training resources</span> to level up your security knowledge.
              </p>
              
              {/* Course Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-[#1c1f26]">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">OWASP Fundamentals</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[#090b0e] border border-[#1c1f26]">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Secure Coding Practices</span>
                </div>
              </div>
            </div>

            {/* Vulnerability Detection */}
            <div className="rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Bug className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-medium">Vulnerability Detection</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Automatically detect <span className="text-white">XSS, SQL Injection, CSRF</span> and other common vulnerabilities.
              </p>
              
              {/* Code Preview */}
              <div className="bg-[#090b0e] rounded border border-[#1c1f26] p-3 font-mono text-xs">
                <div className="text-gray-600">// Detected vulnerability</div>
                <div className="text-red-400">⚠ SQL Injection at line 42</div>
                <div className="text-gray-500 mt-1">query = "SELECT * FROM users WHERE id=" + <span className="text-red-400">userInput</span></div>
              </div>
            </div>

            {/* Penetration Testing */}
            <div className="rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Fingerprint className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-medium">Penetration Testing</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Professional <span className="text-white">ethical hacking</span> services to identify security weaknesses before attackers do.
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  <span>Manual Testing</span>
                </div>
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span>Automated Scans</span>
                </div>
              </div>
            </div>

            {/* Reports & Analytics */}
            <div className="rounded-lg bg-[#0d0f14] border border-[#1c1f26] p-6 hover:border-[#3ecf8e]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <FileSearch className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-medium">Reports & Analytics</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Detailed <span className="text-white">security reports</span> with actionable insights and remediation steps.
              </p>
              
              {/* Mini Chart */}
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-[#3ecf8e]/50 to-[#3ecf8e] rounded-t"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom tagline */}
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-400">
              <span className="text-white">Use one or all.</span> Best of breed security products. Integrated as a platform.
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail Section */}
      <section id="services" className="py-16 lg:py-24 bg-[#0d0f14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">
              Complete Security Solutions
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Everything you need to secure, monitor, and protect your applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[#3ecf8e]/10 flex items-center justify-center">
                <Scan className="w-8 h-8 text-[#3ecf8e]" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Automated Scanning</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Schedule automated security scans for your applications. Get instant alerts when vulnerabilities are detected.
              </p>
            </div>

            {/* Service 2 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Expert Team Access</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Connect with certified security professionals for in-depth analysis, consulting, and custom security solutions.
              </p>
            </div>

            {/* Service 3 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Security Training</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Comprehensive courses and hands-on labs to train your team on the latest security best practices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Section */}
      <section id="learning" className="py-16 lg:py-24 bg-[#090b0e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-medium text-white mb-6">
                Learn Cyber Security<br />
                <span className="text-[#3ecf8e]">from the experts</span>
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Access comprehensive learning resources designed by industry professionals. 
                From beginner fundamentals to advanced penetration testing techniques.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, title: "OWASP Top 10 Deep Dive", level: "Beginner" },
                  { icon: <Code className="w-5 h-5" />, title: "Secure Coding in JavaScript", level: "Intermediate" },
                  { icon: <Terminal className="w-5 h-5" />, title: "Advanced Penetration Testing", level: "Advanced" },
                  { icon: <Lock className="w-5 h-5" />, title: "API Security Masterclass", level: "Intermediate" },
                ].map((course, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#0d0f14] border border-[#1c1f26] hover:border-[#3ecf8e]/30 transition-all cursor-pointer">
                    <div className="p-2 rounded-lg bg-[#1c1f26] text-[#3ecf8e]">
                      {course.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">{course.title}</h4>
                      <p className="text-gray-500 text-xs">{course.level}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Award className="w-6 h-6" />, value: "50+", label: "Courses Available" },
                { icon: <Users className="w-6 h-6" />, value: "10K+", label: "Students Enrolled" },
                { icon: <TrendingUp className="w-6 h-6" />, value: "95%", label: "Completion Rate" },
                { icon: <CheckCircle className="w-6 h-6" />, value: "24/7", label: "Expert Support" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-lg bg-[#0d0f14] border border-[#1c1f26] text-center">
                  <div className="inline-flex p-3 rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e] mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-[#0d0f14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-medium text-white mb-4">
            Build secure apps, <span className="text-[#3ecf8e]">scale with confidence</span>
          </h2>
          <p className="text-gray-500 mb-8">
            Start protecting your applications today with our comprehensive security platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link 
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#3ecf8e] text-[#090b0e] font-medium hover:bg-[#34b379] transition-all"
            >
              Start your project
            </Link>
            <a 
              href="#"
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[#1c1f26] text-white font-medium hover:bg-[#252932] border border-[#2a2e38] transition-all"
            >
              Request a demo
            </a>
          </div>

          {/* Security badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span>We protect your data.</span>
            <a href="#" className="text-[#3ecf8e] hover:underline">More on Security</a>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#3ecf8e]" />
              <span className="text-white">SOC2 Type 2</span>
              <span>Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#3ecf8e]" />
              <span className="text-white">ISO 27001</span>
              <span>Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#090b0e] border-t border-[#1c1f26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Logo Column */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img 
                  src="/file_000000001d206246bd4f17ee6a946aa9.png" 
                  alt="CloverGuard Logo" 
                  className="w-7 h-7 object-contain rounded-full"
                />
                <span className="text-white font-semibold">CloverGuard</span>
              </Link>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Security Scan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vulnerability Detection</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Penetration Testing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Consulting</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Code Review</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Incident Response</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Learning Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">OWASP Guide</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white text-sm font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1c1f26] text-center text-sm text-gray-600">
            © 2025 CloverGuard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
