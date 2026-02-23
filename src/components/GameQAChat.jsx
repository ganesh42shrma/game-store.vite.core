import { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Gamepad2, Plus, ChevronDown, ChevronRight, History, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import * as chatApi from '../api/chat.js';
import { getAddresses } from '../api/addresses.js';
import ChatGameCard from './ChatGameCard.jsx';
import ChatOrderCard from './ChatOrderCard.jsx';
import ChatInvoiceCard from './ChatInvoiceCard.jsx';
import ChatBuyConfirmation from './ChatBuyConfirmation.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useConfirmation } from '../hooks/useConfirmation.js';

const SUGGESTED_QUESTIONS = [
  'What games are on sale?',
  'Games like Hades?',
  'Best RPGs under $30',
  'Buy Elden Ring for me',
];

const ChatMessage = memo(function ChatMessage({ m, onNavigate }) {
  return (
    <li className={`flex min-w-0 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] min-w-0 rounded-xl px-3 py-2 text-sm ${m.role === 'user'
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
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
        {m.role === 'assistant' && (m.meta?.orderId || m.meta?.invoiceId || m.meta?.mockPaymentUrl || m.meta?.paymentId) && (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-gray-200/50 pt-2">
            {m.meta?.orderId && (
              <ChatOrderCard
                orderId={m.meta.orderId}
                onNavigate={onNavigate}
              />
            )}
            {m.meta?.invoiceId && m.meta?.orderId && (
              <ChatInvoiceCard
                orderId={m.meta.orderId}
                invoiceId={m.meta.invoiceId}
                onNavigate={onNavigate}
              />
            )}
            {(m.meta?.mockPaymentUrl || m.meta?.paymentId) && (
              <Link
                to={m.meta.mockPaymentUrl?.startsWith('/') ? m.meta.mockPaymentUrl : `/pay/${m.meta.paymentId || ''}`}
                onClick={onNavigate}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Complete payment →
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
});

export default function GameQAChat() {
  // ... existing component code

  const { refreshCart } = useCart();
  const confirm = useConfirmation();
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
  const [threads, setThreads] = useState([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [popoverThreadId, setPopoverThreadId] = useState(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const popoverRef = useRef(null);

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
      if (e.key === 'Escape') {
        setOpen(false);
        setPopoverThreadId(null);
        setEditingThreadId(null);
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverThreadId(null);
        setEditingThreadId(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load addresses when panel opens (for quick actions in buy flow)
  useEffect(() => {
    if (!open) return;
    getAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, [open]);

  // Load threads when panel opens (for chat history tab)
  useEffect(() => {
    if (!open) return;
    chatApi
      .getChatThreads()
      .then(({ threads: list }) => setThreads(list.slice(0, 3)))
      .catch(() => setThreads([]));
  }, [open, messages.length]);

  // Reset buy confirmation selection when messages change (e.g. new agent reply)
  useEffect(() => {
    setSelectedAddressId(null);
    setSelectedPayment(null);
  }, [messages.length]);

  // Load chat history when panel opens or thread changes
  useEffect(() => {
    if (!open || isNewChat) return;
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
          meta: m.meta,
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
  }, [open, threadId]);

  const handleNewChat = () => {
    setIsNewChat(true);
    setThreadId(null);
    setMessages([]);
    setError(null);
  };

  const handleSwitchThread = (tid) => {
    setIsNewChat(false);
    setThreadId(tid);
    setHistoryExpanded(false);
    setPopoverThreadId(null);
    setEditingThreadId(null);
  };

  const handleDeleteThread = async (tid) => {
    setPopoverThreadId(null);
    try {
      await chatApi.deleteChatThread(tid);
      setThreads((prev) => prev.filter((t) => (t.threadId ?? t.thread_id) !== tid));
      if (threadId === tid && !isNewChat) {
        const remaining = threads.filter((t) => (t.threadId ?? t.thread_id) !== tid);
        if (remaining.length > 0) {
          handleSwitchThread(remaining[0].threadId ?? remaining[0].thread_id);
        } else {
          setIsNewChat(true);
          setThreadId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete thread');
    }
  };

  const handleSaveRename = async (tid) => {
    const title = editTitleValue.trim();
    if (!title) return;
    try {
      await chatApi.renameChatThread(tid, title);
      setThreads((prev) =>
        prev.map((t) =>
          (t.threadId ?? t.thread_id) === tid ? { ...t, title } : t
        )
      );
      setEditingThreadId(null);
      setEditTitleValue('');
      setPopoverThreadId(null);
    } catch (err) {
      setError(err?.message || 'Failed to rename thread');
    }
  };

  const handleCancelRename = () => {
    setEditingThreadId(null);
    setEditTitleValue('');
  };

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
        threadId: isNewChat ? undefined : (threadId || undefined),
        newChat: isNewChat,
        onThinking(content) {
          console.log('[GameQAChat] onThinking called with:', content);
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
          if (tid) {
            setThreadId(tid);
            setIsNewChat(false);
            chatApi.getChatThreads().then(({ threads: list }) => setThreads(list.slice(0, 3)));
          }
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
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <Gamepad2 className="h-4 w-4 shrink-0 text-gray-500" />
                <h2 className="truncate text-sm font-semibold text-gray-900">
                  {isNewChat
                    ? 'New chat'
                    : (() => {
                      const t = threads.find((x) => (x.threadId ?? x.thread_id) === threadId);
                      return t?.title || 'Chat';
                    })()}
                </h2>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="New chat"
                  title="New chat"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="shrink-0 border-b border-gray-50">
              <button
                type="button"
                onClick={() => setHistoryExpanded((e) => !e)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50"
                aria-expanded={historyExpanded}
              >
                {historyExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                )}
                <History className="h-3.5 w-3.5 shrink-0" />
                <span>History</span>
                {threads.length > 0 && (
                  <span className="text-gray-400">· {threads.length}</span>
                )}
              </button>
              {historyExpanded && (
                <div className="border-t border-gray-50 px-2 py-1.5">
                  {threads.length === 0 ? (
                    <p className="px-2 py-2 text-xs text-gray-400">No conversations yet</p>
                  ) : (
                    <ul className="space-y-0.5" ref={popoverRef}>
                      {threads.map((t, i) => {
                        const tid = t.threadId ?? t.thread_id;
                        const isActive = tid === threadId && !isNewChat;
                        const title = t.title || `Chat ${i + 1}`;
                        const dateStr = t.lastMessageAt
                          ? new Date(t.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : null;
                        const isPopoverOpen = popoverThreadId === tid;
                        const isEditing = editingThreadId === tid;
                        return (
                          <li key={tid} className="relative flex items-center gap-0.5 rounded group">
                            <button
                              type="button"
                              onClick={() => handleSwitchThread(tid)}
                              className={`min-w-0 flex-1 rounded px-2 py-1 text-left text-xs ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                              <span className="truncate block">{title}</span>
                            </button>
                            {dateStr && (
                              <span className="shrink-0 text-[10px] text-gray-400 w-12 text-right">{dateStr}</span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPopoverThreadId(isPopoverOpen ? null : tid);
                                if (isPopoverOpen) setEditingThreadId(null);
                              }}
                              className="shrink-0 rounded p-0.5 text-gray-400 opacity-70 hover:opacity-100 hover:bg-gray-200"
                              aria-label="Thread options"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                            {isPopoverOpen && (
                              <div className="absolute right-0 top-full z-10 mt-0.5 w-40 rounded-md border border-gray-200 bg-white py-0.5 shadow-lg">
                                {isEditing ? (
                                  <div className="px-2 py-1.5 space-y-1.5">
                                    <input
                                      type="text"
                                      value={editTitleValue}
                                      onChange={(e) => setEditTitleValue(e.target.value)}
                                      placeholder="Thread title"
                                      maxLength={100}
                                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveRename(tid)}
                                        disabled={!editTitleValue.trim()}
                                        className="flex-1 rounded bg-gray-900 px-2 py-0.5 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { handleCancelRename(); setPopoverThreadId(null); }}
                                        className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingThreadId(tid); setEditTitleValue(t.title || ''); }}
                                      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        confirm({
                                          title: 'Delete conversation?',
                                          message: 'This cannot be undone.',
                                          confirmLabel: 'Delete',
                                          variant: 'danger',
                                          onConfirm: () => handleDeleteThread(tid),
                                        });
                                      }}
                                      className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
              {historyLoading && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-500">Loading conversation…</p>
                </div>
              )}
              {!historyLoading && messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Ask about games, prices, stock, or buy. I can add to cart and create alerts.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSuggested(q)}
                        className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-left text-xs text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!historyLoading && (
                <>
                  <ul className="space-y-2">
                    {messages.map((m, i) => (
                      <ChatMessage
                        key={i}
                        m={m}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-xl bg-gray-100 px-3 py-2 text-xs text-gray-500">
                        <span className="animate-pulse">{thinkingText || 'Thinking…'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="shrink-0 border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
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
                  <div className="shrink-0 border-t border-gray-50 bg-gray-50/50 px-3 py-2">
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
                <div className="shrink-0 border-t border-gray-50 bg-gray-50/50 px-3 py-2">
                  <p className="text-[10px] font-medium text-gray-400 mb-1">Quick reply</p>
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
              className="shrink-0 border-t border-gray-100 p-2"
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
                  placeholder="Ask about games…"
                  maxLength={2000}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-60"
                  aria-label="Message"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
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
