import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import AIChatPanel from '../components/AIChatPanel';
import { fetchAiMeta, setSettings } from '../redux/chatSlice';
import { Loader2, RefreshCcw } from 'lucide-react';

const CONVERSATION_ID = 'global';

export default function AIChat() {
  const dispatch = useDispatch();
  const meta = useSelector((state) => state.chat.meta);
  const settings = useSelector((state) => state.chat.settings);

  useEffect(() => {
    if (meta.status === 'idle') {
      dispatch(fetchAiMeta());
    }
  }, [dispatch, meta.status]);

  const providers = (meta.providers || []).filter((provider) => provider.enabled);
  const resolvedProvider = settings.provider || meta.defaults?.provider || (providers[0]?.key ?? null);
  const providerOptions = providers.length ? providers : meta.providers || [];
  const selectedProviderData = providerOptions.find((item) => item.key === resolvedProvider);
  const modelOptions = selectedProviderData?.models || [];

  const handleSettingChange = (key, value) => {
    dispatch(setSettings({ [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#05070d]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-100 tracking-tight">AI Security Copilot</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Chat with a Gemini/OpenAI powered assistant that understands your scan results. Craft remediation plans,
            prioritise fixes, and request tailored security advice in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AIChatPanel
              conversationId={CONVERSATION_ID}
              description="Share findings or ask for remediation guidance. Clover AI references the latest scan data you provide."
              placeholder="Example: 'Summarise the most critical issues from my last scan.'"
              suggestions={[
                'How should I prioritise remediation this week?',
                'Summarise risk exposure for leadership.',
                'Draft developer guidance for the XSS findings.',
              ]}
            />
          </div>

          <aside className="bg-[#0f1117] border border-[#1a1d24] rounded-3xl shadow-xl p-6 space-y-6 h-fit">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Assistant Settings</h2>
                <button
                  type="button"
                  onClick={() => dispatch(fetchAiMeta())}
                  className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 hover:text-[#3ecf8e] transition"
                  disabled={meta.status === 'loading'}
                >
                  {meta.status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                  Refresh
                </button>
              </div>
              <p className="text-sm text-gray-400">
                Tune how Clover AI answers. Provider and model changes apply to upcoming prompts only.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">Provider</label>
                <select
                  value={resolvedProvider || ''}
                  onChange={(event) => handleSettingChange('provider', event.target.value || null)}
                  className="w-full bg-[#1a1d24] border border-[#1f2330] rounded-xl px-4 py-2 text-sm text-gray-100 focus:border-[#3ecf8e]/70 focus:outline-none"
                >
                  {providerOptions.map((provider) => (
                    <option key={provider.key} value={provider.key}>
                      {provider.key.toUpperCase()} {provider.enabled ? '' : '(disabled)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">Model</label>
                <select
                  value={settings.model || ''}
                  onChange={(event) => handleSettingChange('model', event.target.value || null)}
                  className="w-full bg-[#1a1d24] border border-[#1f2330] rounded-xl px-4 py-2 text-sm text-gray-100 focus:border-[#3ecf8e]/70 focus:outline-none"
                >
                  <option value="">Auto ({selectedProviderData?.defaultModel || 'recommended'})</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature ?? 0.25}
                  onChange={(event) => handleSettingChange('temperature', Number(event.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {settings.temperature?.toFixed(2) ?? '0.25'} · Lower values for precise answers, higher for creative content.
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 mb-2 block">Max Tokens</label>
                <input
                  type="range"
                  min="400"
                  max="2048"
                  step="50"
                  value={settings.maxTokens ?? 1024}
                  onChange={(event) => handleSettingChange('maxTokens', Number(event.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {settings.maxTokens ?? 1024} tokens · Limit response length to control cost and verbosity.
                </div>
              </div>
            </div>

            {meta.status === 'failed' && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                {meta.error}
              </div>
            )}

            {providers.length === 0 && meta.status === 'succeeded' && (
              <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-500/20 rounded-xl p-4">
                No AI provider is currently configured. Add a GEMINI_API_KEY or OPENAI_API_KEY to enable responses.
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
