import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  initializeConversation,
  setConversationContext,
  addMessage,
  resetConversation,
  sendChatMessage,
} from '../redux/chatSlice';
import { Loader2, RotateCcw, Sparkles, Send } from 'lucide-react';

function MessageBubble({ message }) {
  const isAssistant = message.role === 'assistant';
  const alignment = isAssistant ? 'items-start' : 'items-end';
  const bubbleStyles = isAssistant
    ? 'bg-purple-600/10 border border-purple-500/30 text-purple-100'
    : 'bg-[#1a1d24] border border-[#3ecf8e]/20 text-gray-100';

  return (
    <div className={`flex ${alignment} mb-3`}
      aria-label={isAssistant ? 'AI response' : 'User message'}
    >
      <div className={`max-w-full rounded-2xl px-4 py-3 shadow-sm ${bubbleStyles}`}>
        <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
          {isAssistant ? 'Clover AI' : 'You'}
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
          {message.content}
        </pre>
        {message.usage && (
          <div className="text-[10px] uppercase tracking-wide mt-3 opacity-40">
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
    <section className={`bg-[#0f1117] border border-[#1a1d24] rounded-3xl shadow-xl overflow-hidden ${className}`}>
      <header className="px-6 py-5 border-b border-[#1a1d24] flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100 tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-gray-400 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
        {showResetButton && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 hover:text-[#3ecf8e] transition"
            disabled={isSending}
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </header>

      <div className="px-6 py-6 space-y-4 max-h-[480px] overflow-y-auto custom-scroll">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#3ecf8e]/40 bg-[#1a1d24]/60 p-6 text-center text-gray-400">
            <p className="text-sm">Start the conversation by asking about remediation steps, risk impacts, or prioritisation strategies.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div>{error}</div>
            {conversation.errorDetails && (
              <div className="text-xs text-red-300 whitespace-pre-wrap">
                {conversation.errorDetails}
              </div>
            )}
            {conversation.errorMeta && (
              <div className="text-[11px] uppercase tracking-wide text-red-300/80 space-y-1">
                <div>
                  {conversation.errorMeta.provider && `Provider: ${conversation.errorMeta.provider}`}
                  {conversation.errorMeta.model && ` • Model: ${conversation.errorMeta.model}`}
                  {conversation.errorMeta.status && ` • Status: ${conversation.errorMeta.status}`}
                </div>
                {conversation.errorMeta.hint && (
                  <div className="normal-case text-xs text-red-200">
                    Hint: {conversation.errorMeta.hint}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
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
              className="px-3 py-2 rounded-full text-xs font-medium bg-[#1a1d24] text-gray-300 hover:text-[#3ecf8e] border border-[#3ecf8e]/20 hover:border-[#3ecf8e]/50 transition"
              disabled={isSending}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <footer className="px-6 pb-6">
        <div className="flex items-end gap-3 bg-[#1a1d24] border border-[#1f2330] rounded-2xl px-4 py-3 focus-within:border-[#3ecf8e]/60 transition">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 bg-transparent text-sm text-gray-100 resize-none focus:outline-none"
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
            className="p-3 rounded-xl bg-[#3ecf8e] text-[#0f1117] hover:bg-[#34c37f] transition disabled:opacity-40"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {lastUsage && (
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-3">
            {lastUsage.provider} · {lastUsage.model} · tokens {lastUsage.tokens?.total ?? '—'}
          </div>
        )}
      </footer>
    </section>
  );
}
