import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  initializeConversation,
  setConversationContext,
  addMessage,
  resetConversation,
  sendChatMessage,
} from '../redux/chatSlice';
import { useTheme } from '../context/ThemeContext';
import { Loader2, RotateCcw, Sparkles, Send } from 'lucide-react';

function MessageBubble({ message, isDark }) {
  const isAssistant = message.role === 'assistant';
  const alignment = isAssistant ? 'items-start' : 'items-end';
  const bubbleStyles = isAssistant
    ? (isDark ? 'bg-purple-600/10 border border-purple-500/30 text-purple-100' : 'bg-purple-50 border border-purple-200 text-purple-900')
    : (isDark ? 'bg-[#1a1d24] border border-[#3ecf8e]/20 text-gray-100' : 'bg-white border border-gray-200 text-gray-900');

  return (
    <div className={`flex ${alignment} mb-3`}
      aria-label={isAssistant ? 'AI response' : 'User message'}
    >
      <div className={`max-w-full rounded-2xl px-4 py-3 shadow-sm ${bubbleStyles}`}>
        <div className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'opacity-70' : 'opacity-60'}`}>
          {isAssistant ? 'Clover AI' : 'You'}
        </div>
        <pre className={`whitespace-pre-wrap text-sm leading-relaxed font-mono ${isDark ? '' : 'text-gray-800'}`}>
          {message.content}
        </pre>
        {message.usage && (
          <div className={`text-[10px] uppercase tracking-wide mt-3 ${isDark ? 'opacity-40' : 'opacity-50'}`}>
            {message.usage.provider} · {message.usage.model} · tokens {message.usage.tokens?.total ?? '—'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChatPanel({
  conversationId,
  title = 'AI Security Copilot',
  description,
  context,
  placeholder = 'Ask Clover AI about your security posture…',
  suggestions = [],
  showResetButton = true,
  className = '',
}) {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const [input, setInput] = useState('');
  const conversation = useSelector((state) => state.chat.conversations[conversationId]);
  const status = conversation?.status || 'idle';
  const messages = conversation?.messages || [];
  const error = conversation?.error;
  const lastUsage = conversation?.lastUsage;

  const contextSignature = useMemo(
    () => JSON.stringify(context ?? null),
    [context]
  );

  const contextRef = useRef(contextSignature);

  useEffect(() => {
    dispatch(initializeConversation({ conversationId, title, context }));
    contextRef.current = contextSignature;
  }, [conversationId, title, contextSignature, context, dispatch]);

  useEffect(() => {
    if (contextSignature !== contextRef.current) {
      dispatch(setConversationContext({ conversationId, context }));
      contextRef.current = contextSignature;
    }
  }, [conversationId, context, contextSignature, dispatch]);

  const isSending = status === 'loading';

  const handleSend = (messageText) => {
    const trimmed = (messageText ?? input).trim();
    if (!trimmed) {
      return;
    }

    dispatch(addMessage({ conversationId, role: 'user', content: trimmed }));
    dispatch(sendChatMessage({ conversationId }));
    setInput('');
  };

  const handleSuggestion = (text) => {
    setInput(text);
    handleSend(text);
  };

  const handleReset = () => {
    dispatch(resetConversation({ conversationId, preserveContext: true }));
  };

  return (
    <section className={`rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-[#0f1117] border border-[#1a1d24]' : 'bg-white border border-gray-200'} ${className}`}>
      <header className={`px-6 py-5 flex items-start justify-between gap-4 ${isDark ? 'border-b border-[#1a1d24]' : 'border-b border-gray-200'}`}>
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200' : 'bg-purple-100 border border-purple-300 text-purple-600'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h2>
              {description && (
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
              )}
            </div>
          </div>
        </div>
        {showResetButton && (
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 text-xs uppercase tracking-wide transition ${isDark ? 'text-gray-400 hover:text-[#3ecf8e]' : 'text-gray-500 hover:text-[#00723f]'}`}
            disabled={isSending}
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </header>

      <div className="px-6 py-6 space-y-4 max-h-[480px] overflow-y-auto custom-scroll">
        {messages.length === 0 && (
          <div className={`rounded-2xl border border-dashed py-35 p-6 text-center ${isDark ? 'border-[#3ecf8e]/40 bg-[#1a1d24]/60 text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-600'}`}>
            <p className="text-sm">Start the conversation by asking about remediation steps, risk impacts, or prioritisation strategies.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isDark={isDark} />
        ))}

        {error && (
          <div className={`text-sm rounded-xl p-4 space-y-2 ${isDark ? 'text-red-400 bg-red-900/20 border border-red-500/30' : 'text-red-700 bg-red-50 border border-red-300'}`}>
            <div>{error}</div>
            {conversation.errorDetails && (
              <div className={`text-xs whitespace-pre-wrap ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                {conversation.errorDetails}
              </div>
            )}
            {conversation.errorMeta && (
              <div className={`text-[11px] uppercase tracking-wide space-y-1 ${isDark ? 'text-red-300/80' : 'text-red-600/80'}`}>
                <div>
                  {conversation.errorMeta.provider && `Provider: ${conversation.errorMeta.provider}`}
                  {conversation.errorMeta.model && ` • Model: ${conversation.errorMeta.model}`}
                  {conversation.errorMeta.status && ` • Status: ${conversation.errorMeta.status}`}
                </div>
                {conversation.errorMeta.hint && (
                  <div className={`normal-case text-xs ${isDark ? 'text-red-200' : 'text-red-600'}`}>
                    Hint: {conversation.errorMeta.hint}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isSending && (
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating secure guidance…
          </div>
        )}
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestion(suggestion)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition ${isDark ? 'bg-[#1a1d24] text-gray-300 hover:text-[#3ecf8e] border border-[#3ecf8e]/20 hover:border-[#3ecf8e]/50' : 'bg-gray-100 text-gray-700 hover:text-[#00723f] border border-gray-300 hover:border-[#00723f]/50'}`}
              disabled={isSending}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <footer className="px-6 pb-6">
        <div className={`flex items-end gap-3 rounded-2xl px-4 py-3 transition ${isDark ? 'bg-[#1a1d24] border border-[#1f2330] focus-within:border-[#3ecf8e]/60' : 'bg-gray-50 border border-gray-300 focus-within:border-[#00723f]/60'}`}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`flex-1 bg-transparent text-sm resize-none focus:outline-none ${isDark ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
            disabled={isSending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            className="p-3 rounded-xl bg-[#00723f] text-white hover:bg-[#00aa5e] transition disabled:opacity-40"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {lastUsage && (
          <div className={`text-[10px] uppercase tracking-wide mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {lastUsage.provider} · {lastUsage.model} · tokens {lastUsage.tokens?.total ?? '—'}
          </div>
        )}
      </footer>
    </section>
  );
}
