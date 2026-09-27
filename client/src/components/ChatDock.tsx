import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, MessageCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../apiService';
import { safeParse } from '../utils/contractHelpers';
import { FONT } from '../theme';

type Turn = { role: 'user' | 'assistant'; content: string };

/** In-memory only, so the thread survives navigation and clears on refresh. */
const memory: { turns: Turn[]; contractId: string } = { turns: [], contractId: '' };

const OPEN_EVENT = 'lv-open-chat';

export function openVaultChat(contractId?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { contractId } }));
}

function contractLabel(contract: { filename: string; analysis: string | Record<string, unknown> }): string {
  const details = safeParse(contract.analysis);
  const party = details.party && details.party !== 'Unknown' ? details.party : '';
  const subject = details.subject && details.subject !== 'General' ? details.subject : '';
  return [party, subject].filter(Boolean).join(' — ') || contract.filename;
}

function errorText(error: unknown): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return 'Could not answer just now.';
}

export function ChatDock() {
  const { history } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [contractId, setContractId] = useState(() => memory.contractId);
  const [turns, setTurns] = useState<Turn[]>(() => memory.turns);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => setShown(false), 280);
      return () => window.clearTimeout(timer);
    }
    setShown(true);
  }, [open]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const id = (event as CustomEvent<{ contractId?: string }>).detail?.contractId;
      if (typeof id === 'string') {
        setContractId(id);
        memory.contractId = id;
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/chat') return;
    const id = new URLSearchParams(location.search).get('contract');
    if (id) {
      setContractId(id);
      memory.contractId = id;
    }
    setOpen(true);
    navigate('/', { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!open) return;
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(focusTimer);
  }, [open, turns, sending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const root = dockRef.current;
    const viewport = window.visualViewport;
    if (!open || !root || !viewport) return;
    const sync = () => {
      const narrow = window.matchMedia('(max-width: 759px)').matches;
      const lift = narrow ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      root.style.setProperty('--chat-lift', `${lift}px`);
    };
    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
      root.style.removeProperty('--chat-lift');
    };
  }, [open]);

  const remember = (next: Turn[]) => {
    memory.turns = next;
    setTurns(next);
  };

  const chooseContract = (id: string) => {
    setContractId(id);
    memory.contractId = id;
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    const prior = turns;
    const asked = [...turns, { role: 'user' as const, content: message }];
    remember(asked);
    setDraft('');
    setSending(true);
    try {
      const res = await api.chat({
        message,
        contract_id: contractId || undefined,
        messages: prior,
      });
      remember([...asked, { role: 'assistant', content: res.data.reply || 'No answer.' }]);
    } catch (error) {
      remember([...asked, { role: 'assistant', content: errorText(error) }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <div className="chat-dock" ref={dockRef}>
      {shown && (
        <div
          className={`chat-dock-scrim${open ? ' is-open' : ''}`}
          onClick={close}
        />
      )}
      {shown && (
        <section
          className={`chat-dock-panel${open ? ' is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-dock-title"
        >
          <header className="chat-dock-header">
            <div>
              <h2 id="chat-dock-title" style={{ fontFamily: FONT.heading, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                Ask
              </h2>
              <p className="chat-dock-note">Answers use the saved analyses.</p>
            </div>
            <button type="button" className="chat-dock-close" onClick={close} aria-label="Close">
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </header>

          <label className="chat-dock-scope">
            <select
              value={contractId}
              aria-label="Ask about"
              onChange={(event) => chooseContract(event.target.value)}
            >
              <option value="">All contracts</option>
              {history.map((contract) => (
                <option key={contract.contract_id} value={contract.contract_id}>
                  {contractLabel(contract)}
                </option>
              ))}
            </select>
          </label>

          <div className="chat-dock-thread" ref={threadRef} role="log" aria-live="polite" aria-relevant="additions">
            {turns.length === 0 && (
              <p className="chat-dock-empty">Ask about a party, a date, or a risk.</p>
            )}
            {turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={`chat-turn chat-turn-${turn.role}`}>
                {turn.content}
              </div>
            ))}
            {sending && <p className="chat-dock-pending">Looking through the saved analyses…</p>}
          </div>

          <form
            className="chat-dock-form"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Ask a question"
              aria-label="Ask a question"
            />
            <button type="submit" className="chat-dock-send" disabled={sending || !draft.trim()} aria-label="Send">
              <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
            </button>
          </form>
        </section>
      )}

      {showHint && !open && (
        <p className="chat-dock-hint" role="status">Chat about your contracts</p>
      )}

      <button
        ref={toggleRef}
        type="button"
        className={`chat-dock-toggle${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? 'Close chat' : 'Ask about your contracts'}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <MessageCircle size={22} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
