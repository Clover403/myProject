import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AIChatPanel from '../components/AIChatPanel';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft } from 'lucide-react';

const CONVERSATION_ID = 'global';

export default function AIChat() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#05070d]' : 'bg-gray-50'}`}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-medium transition ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mt-6 mb-8">
          <h1 className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            AI Security Copilot
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 max-w-2xl`}>
            Chat with a provider-backed assistant that understands your scan results. Request remediation guidance,
            prioritise fixes, and ask quick questions in real time—no tuning required.
          </p>
        </div>

        <AIChatPanel
          conversationId={CONVERSATION_ID}
          description="Share findings or ask for remediation guidance. Clover AI references the latest scan data you provide."
          placeholder="Example: 'Summarise the most critical issues from my last scan.'"
          suggestions={[
            'How should I prioritise remediation this week?',
            'Summarise risk exposure for leadership.',
            'Draft developer guidance for the XSS findings.',
          ]}
          className="shadow-2xl"
        />
      </main>
    </div>
  );
}
