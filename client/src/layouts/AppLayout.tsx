import type { CSSProperties } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ContractCard } from '../components/ContractCard';
import { useApp } from '../context/AppContext';
import { api } from '../apiService';
import { Body1, Caption1 } from '@fluentui/react-components';

const navFont = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif';
const SIDEBAR_WIDTH = 260;
const NAVBAR_HEIGHT = 72;

const sidebarStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  top: NAVBAR_HEIGHT,
  width: SIDEBAR_WIDTH,
  height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
  background: '#fff',
  borderRight: '1px solid #e2e8f0',
  padding: '20px 0',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: navFont,
  zIndex: 40,
  overflow: 'hidden',
};

const navLinkBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '18px 24px',
  margin: '0 12px',
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 600,
  color: '#64748b',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  fontFamily: navFont,
  letterSpacing: '-0.01em',
};

const navLinkActive: CSSProperties = {
  background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
  color: '#6366f1',
};

const sidebarBottomStyle: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 20,
  paddingBottom: 24,
  borderTop: '1px solid #e2e8f0',
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
  marginTop: 8,
  borderTop: '1px solid #e2e8f0',
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
          >
            <span aria-hidden style={{ fontSize: 20 }}>🏠</span>
            Home
          </NavLink>
          <NavLink
            to="/contracts"
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
          >
            <span aria-hidden style={{ fontSize: 20 }}>📄</span>
            Contracts
          </NavLink>
          <NavLink
            to="/analytics"
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
          >
            <span aria-hidden style={{ fontSize: 20 }}>📊</span>
            Analytics
          </NavLink>
        </nav>

        <div style={recentSectionStyle}>
          <Caption1 block style={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Recent
          </Caption1>
          {recentContracts.length === 0 ? (
            <Body1 style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No contracts yet</Body1>
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
          <NavLink
            to="/settings"
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
          >
            <span aria-hidden style={{ fontSize: 20 }}>⚙️</span>
            Settings
          </NavLink>
          <NavLink
            to="/about"
            style={({ isActive }) => ({ ...navLinkBase, ...(isActive ? navLinkActive : {}) })}
          >
            <span aria-hidden style={{ fontSize: 20 }}>ℹ️</span>
            About
          </NavLink>
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
          fontFamily: navFont,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
