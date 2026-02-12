import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Gamepad2 } from 'lucide-react';
import * as chatApi from '../api/chat.js';
import { getAddresses } from '../api/addresses.js';
import ChatGameCard from './ChatGameCard.jsx';
import ChatOrderCard from './ChatOrderCard.jsx';
import ChatInvoiceCard from './ChatInvoiceCard.jsx';
import ChatBuyConfirmation from './ChatBuyConfirmation.jsx';
import { useCart } from '../context/CartContext.jsx';

const SUGGESTED_QUESTIONS = [
  'What games are on sale?',
  'Games like Hades?',
  'Best RPGs under $30',
  'Buy Elden Ring for me',
];

export default function GameQAChat() {
  const { refreshCart } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(null);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  // Lock body scroll and block background interaction when chat is open
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevWidth = document.body.style.width;
    const prevTop = document.body.style.top;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = prevWidth;
      document.body.style.top = prevTop;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);

  // Load addresses when panel opens (for quick actions in buy flow)
  useEffect(() => {
    if (!open) return;
    getAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [open]);

  // Reset buy confirmation selection when messages change (e.g. new agent reply)
  useEffect(() => {
    setSelectedAddressId(null);
    setSelectedPayment(null);
  }, [messages.length]);

  // Load chat history when panel opens (persisted session)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setHistoryLoading(true);
    setError(null);
    chatApi
      .getChatHistory({ threadId: threadId || undefined, limit: 50 })
      .then(({ messages: historyMessages, threadId: tid }) => {
        if (cancelled) return;
        setThreadId(tid || null);
        const mapped = (historyMessages || []).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content || '',
          productIds: m.productIds && Array.isArray(m.productIds) ? m.productIds : [],
        }));
        setMessages(mapped);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load chat history');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSend = async (text, options = {}) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const displayContent = options.displayContent ?? msg;
    setInput('');
    setError(null);
    setThinkingText(null);
    setMessages((prev) => [...prev, { role: 'user', content: displayContent }]);
    setLoading(true);
    let productIds = [];

    try {
      await chatApi.sendMessageStream(msg, {
        threadId: threadId || undefined,
        onThinking(content) {
          setThinkingText(content || 'Thinking…');
        },
        onChunk(content) {
          setThinkingText(null);
          setMessages((prev) => {
            const rest = prev.slice(0, -1);
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant' && last?.streaming) {
              return [...rest, { ...last, content: (last.content || '') + content }];
            }
            return [...prev, { role: 'assistant', content, streaming: true }];
          });
        },
        onDone(ids, tid, meta = {}) {
          productIds = ids;
          if (tid) setThreadId(tid);
          setThinkingText(null);
          refreshCart();
          setMessages((prev) => {
            const rest = prev.slice(0, -1);
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...rest, { ...last, streaming: false, productIds, meta }];
            }
            return [...prev, { role: 'assistant', content: '', streaming: false, productIds, meta }];
          });
        },
        onError(errMsg) {
          setError(errMsg);
        },
      });
    } catch (err) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg, error: true, productIds: [] },
      ]);
    } finally {
      setLoading(false);
      setThinkingText(null);
    }
  };

  const handleSuggested = (q) => {
    setInput(q);
    handleSend(q);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        aria-label="Open game Q&A chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed inset-0 z-50 flex justify-end bg-black/30 overflow-hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Game Q&A chat"
          style={{ touchAction: 'none' }}
          onClick={(e) => e.target === panelRef.current && setOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-full flex-col bg-white shadow-xl sm:max-w-md md:max-w-lg min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Gamepad2 className="h-5 w-5 shrink-0 text-gray-700" />
                <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">Ask about games</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 sm:px-4 sm:py-3">
              {historyLoading && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-500">Loading conversation…</p>
                </div>
              )}
              {!historyLoading && messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Ask about games, prices, stock, sales, or reviews. I can add to cart, buy games for you, and create alerts. When you say &quot;Buy X for me&quot;, I&apos;ll ask for address and payment in one reply—e.g. &quot;Default address, UPI&quot; or use the quick buttons below.
                  </p>
                  <p className="text-xs font-medium text-gray-500">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSuggested(q)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!historyLoading && (
                <>
                  <ul className="space-y-3 sm:space-y-4">
                    {messages.map((m, i) => (
                      <li
                        key={i}
                        className={`flex min-w-0 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] min-w-0 rounded-2xl px-3 py-2 text-sm sm:px-4 sm:py-2.5 ${
                            m.role === 'user'
                              ? 'bg-gray-900 text-white'
                              : m.error
                                ? 'bg-red-50 text-red-800'
                                : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {(m.content || m.error) && (
                            <p className="whitespace-pre-wrap wrap-break-word">{m.content}</p>
                          )}
                          {m.productIds?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 border-t border-gray-200/50 pt-2 sm:gap-3">
                              {m.productIds.map((id) => (
                                <ChatGameCard
                                  key={id}
                                  productId={id}
                                  onNavigate={() => setOpen(false)}
                                />
                              ))}
                            </div>
                          )}
                          {m.role === 'assistant' && (m.meta?.orderId || m.meta?.invoiceId || m.meta?.mockPaymentUrl || m.meta?.paymentId) && (
                            <div className="mt-2 flex flex-wrap gap-2 border-t border-gray-200/50 pt-2">
                              {m.meta?.orderId && (
                                <ChatOrderCard
                                  orderId={m.meta.orderId}
                                  onNavigate={() => setOpen(false)}
                                />
                              )}
                              {m.meta?.invoiceId && m.meta?.orderId && (
                                <ChatInvoiceCard
                                  orderId={m.meta.orderId}
                                  invoiceId={m.meta.invoiceId}
                                  onNavigate={() => setOpen(false)}
                                />
                              )}
                              {(m.meta?.mockPaymentUrl || m.meta?.paymentId) && (
                                <Link
                                  to={m.meta.mockPaymentUrl?.startsWith('/') ? m.meta.mockPaymentUrl : `/pay/${m.meta.paymentId || ''}`}
                                  onClick={() => setOpen(false)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                                >
                                  Complete payment →
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
                        <span className="animate-pulse">{thinkingText ?? 'Thinking…'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="border-t border-gray-100 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                {error}
              </div>
            )}

            {(() => {
              const lastMsg = messages.filter((m) => m.role === 'assistant').pop();
              const lastContent = (lastMsg?.content || '').toLowerCase();
              const asksAddress = lastContent.includes('address') && !loading;
              const asksPayment = (lastContent.includes('payment') || lastContent.includes('method')) && !loading;
              const hasAddresses = addresses.length > 0;
              const asksBoth = asksAddress && asksPayment;
              const showQuickActions = asksAddress || asksPayment;

              if (!showQuickActions || messages.length === 0) return null;

              if (asksBoth && hasAddresses) {
                const selectedAddr = addresses.find((a) => (a._id || a.id) === selectedAddressId);
                const paymentLabels = { mock_card: 'Card', mock_upi: 'UPI', mock_netbanking: 'Net Banking' };
                const displayLabel = selectedAddr && selectedPayment
                  ? `${selectedAddr.label || 'Address'}, ${paymentLabels[selectedPayment] || selectedPayment}`
                  : null;
                return (
                  <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-3 py-3 sm:px-4">
                    <ChatBuyConfirmation
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      selectedPayment={selectedPayment}
                      onSelectAddress={setSelectedAddressId}
                      onSelectPayment={setSelectedPayment}
                      onConfirm={() => {
                        if (selectedAddressId && selectedPayment) {
                          handleSend(`${selectedAddressId}, ${selectedPayment}`, {
                            displayContent: displayLabel || 'Address and payment selected',
                          });
                          setSelectedAddressId(null);
                          setSelectedPayment(null);
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                );
              }

              return (
                <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-3 py-2 sm:px-4">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Quick reply:</p>
                  <div className="flex flex-wrap gap-2">
                    {asksAddress && !hasAddresses && (
                      <Link
                        to="/profile/addresses"
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
                      >
                        Add address first →
                      </Link>
                    )}
                    {asksAddress && hasAddresses && !asksPayment && (
                      <button
                        type="button"
                        onClick={() => handleSend('Use my default address')}
                        disabled={loading}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Use default address
                      </button>
                    )}
                    {asksPayment && !asksAddress && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSend('mock_card')}
                          disabled={loading}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSend('mock_upi')}
                          disabled={loading}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          UPI
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSend('mock_netbanking')}
                          disabled={loading}
                          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          Net Banking
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <form
              className="shrink-0 border-t border-gray-200 p-2 sm:p-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="flex min-w-0 gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about games, or reply to questions…"
                  maxLength={2000}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-60 sm:px-4 sm:py-2.5"
                  aria-label="Message"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900"
                  aria-label="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
