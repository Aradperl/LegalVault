import type { CSSProperties } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ContractCard } from '../components/ContractCard';
import { useApp } from '../context/AppContext';
import { api } from '../apiService';
import { Body1 } from '@fluentui/react-components';
import { Home, FileText, BarChart3, Settings, Info, type LucideIcon } from 'lucide-react';
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

function SideLink({ to, icon: Icon, label, end }: { to: string; icon: LucideIcon; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="nav-link"
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

export function AppLayout() {
  const app = useApp();
  const recentContracts = getRecentContracts(app.history || []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.vault }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <Navbar
          isGoogleConnected={app.isGoogleConnected}
          userPicture={app.userPicture}
          currentUser={app.currentUser}
          onGoogleConnect={async () => {
            try {
              const res = await api.connectGoogle();
              if (res.data.url) window.open(res.data.url, 'google-auth', 'width=500,height=600');
            } catch {
              alert('Google Connect Failed');
            }
          }}
        />
      </div>

      <aside style={sidebarStyle}>
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
    </div>
  );
}
