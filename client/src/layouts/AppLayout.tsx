import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ContractCard } from '../components/ContractCard';
import { useApp } from '../context/AppContext';
import { api } from '../apiService';
import { Body1, Button } from '@fluentui/react-components';
import { Home, FileText, BarChart3, Settings, Info, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { ChatDock } from '../components/ChatDock';
import { C, FONT } from '../theme';
const SIDEBAR_WIDTH = 260;
const NAVBAR_HEIGHT = 72;

const sidebarStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  top: NAVBAR_HEIGHT,
  width: SIDEBAR_WIDTH,
  height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
  background: C.vault,
  borderRight: `1px solid ${C.slate}`,
  padding: '20px 0',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: FONT.body,
  zIndex: 40,
  overflow: 'hidden',
};

const navLinkBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '11px 16px',
  margin: '0 12px',
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 500,
  color: C.muted,
  textDecoration: 'none',
  transition: 'color 0.15s ease, background-color 0.15s ease',
  fontFamily: FONT.body,
  boxShadow: 'inset 2px 0 0 transparent',
};

const navLinkActive: CSSProperties = {
  background: C.slate,
  color: C.text,
  boxShadow: `inset 2px 0 0 ${C.emerald}`,
};

function SideLink({ to, icon: Icon, label, end, onClick }: { to: string; icon: LucideIcon; label: string; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="nav-link"
      onClick={onClick}
      style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} strokeWidth={2} color={isActive ? C.emerald : 'currentColor'} aria-hidden />
          {label}
        </>
      )}
    </NavLink>
  );
}

const sidebarBottomStyle: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 20,
  paddingBottom: 24,
  borderTop: `1px solid ${C.slate}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flexShrink: 0,
};

const recentSectionStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '16px 12px 0',
  marginTop: 12,
  borderTop: `1px solid ${C.slate}`,
};

function getRecentContracts(history: { contract_id: string; timestamp: string }[]) {
  return [...(history || [])]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}

function TabLink({ to, icon: Icon, label, end }: { to: string; icon: LucideIcon; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `app-tab${isActive ? ' is-active' : ''}`}
    >
      <Icon size={20} strokeWidth={2} aria-hidden />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const app = useApp();
  const location = useLocation();
  const recentContracts = getRecentContracts(app.history || []);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreSheetRef = useRef<HTMLDivElement>(null);
  const moreInMenu = location.pathname === '/settings' || location.pathname === '/about';

  const connectGoogle = async () => {
    try {
      const res = await api.connectGoogle();
      if (res.data.url) window.open(res.data.url, 'google-auth', 'width=500,height=600');
    } catch {
      alert('Google Connect Failed');
    }
  };

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    moreSheetRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', backgroundColor: C.vault }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <Navbar
          isGoogleConnected={app.isGoogleConnected}
          userPicture={app.userPicture}
          currentUser={app.currentUser}
          onGoogleConnect={connectGoogle}
        />
      </div>

      <aside className="app-sidebar" style={sidebarStyle}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SideLink to="/" end icon={Home} label="Home" />
          <SideLink to="/contracts" icon={FileText} label="Contracts" />
          <SideLink to="/analytics" icon={BarChart3} label="Analytics" />
        </nav>

        <div style={recentSectionStyle}>
          <h2 style={{ fontFamily: FONT.heading, fontSize: 13, fontWeight: 600, color: C.muted, margin: '0 4px 10px' }}>
            Recently added
          </h2>
          {recentContracts.length === 0 ? (
            <Body1 style={{ fontSize: 13, color: C.faint, margin: '0 4px' }}>Contracts you upload will appear here.</Body1>
          ) : (
            recentContracts.map((contract) => (
              <div key={contract.contract_id} style={{ width: '100%', minWidth: 0, marginBottom: 12 }}>
                <ContractCard
                  contract={contract}
                  onDelete={app.handleDeleteContract}
                  onFileClick={app.handleFileClick}
                  onViewInsights={app.setSelectedAnalysis}
                  onReminderChange={app.handleNotificationChange}
                  isGoogleConnected={app.isGoogleConnected}
                  customFolders={[]}
                  compact
                />
              </div>
            ))
          )}
        </div>

        <div style={sidebarBottomStyle}>
          <SideLink to="/settings" icon={Settings} label="Settings" />
          <SideLink to="/about" icon={Info} label="About" />
        </div>
      </aside>

      <main
        className="app-main"
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: NAVBAR_HEIGHT + 20,
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          overflow: 'auto',
          paddingLeft: 32,
          paddingRight: 32,
          paddingBottom: 48,
          fontFamily: FONT.body,
          color: C.text,
        }}
      >
        <Outlet />
      </main>

      <ChatDock />

      <nav className="app-tabbar" aria-label="Primary">
        <TabLink to="/" end icon={Home} label="Home" />
        <TabLink to="/contracts" icon={FileText} label="Contracts" />
        <TabLink to="/analytics" icon={BarChart3} label="Analytics" />
        <button
          type="button"
          className={`app-tab${moreOpen || moreInMenu ? ' is-active' : ''}`}
          aria-expanded={moreOpen}
          aria-controls="more-sheet"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal size={20} strokeWidth={2} aria-hidden />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="more-backdrop" onClick={() => setMoreOpen(false)}>
          <div
            ref={moreSheetRef}
            id="more-sheet"
            className="more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More"
            onClick={(event) => event.stopPropagation()}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SideLink to="/settings" icon={Settings} label="Settings" onClick={() => setMoreOpen(false)} />
              <SideLink to="/about" icon={Info} label="About" onClick={() => setMoreOpen(false)} />
            </nav>
            <div className="more-sheet-calendar">
              {app.isGoogleConnected ? (
                <span style={googleStatusStyle} role="status">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.emerald, flexShrink: 0 }} aria-hidden />
                  Google Calendar connected
                </span>
              ) : (
                <Button appearance="outline" style={{ width: '100%' }} onClick={connectGoogle}>
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const googleStatusStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  fontWeight: 500,
  color: C.textSoft,
  padding: '6px 12px',
  borderRadius: 6,
  border: `1px solid ${C.slate}`,
};
