import React from 'react';
import { Button, Avatar } from '@fluentui/react-components';
import { ThemeToggle } from './ThemeToggle';
import { C, FONT } from '../theme';

interface NavbarProps {
  isGoogleConnected: boolean;
  userPicture: string | null;
  currentUser: string;
  onGoogleConnect: () => void;
}

const navbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 72,
  padding: '0 28px',
  background: 'var(--nav-bg)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${C.slate}`,
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: FONT.heading,
  fontWeight: 800,
  fontSize: 17,
  letterSpacing: '0.06em',
  color: C.text,
};

const googleStatusStyle: React.CSSProperties = {
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

export const Navbar: React.FC<NavbarProps> = ({ isGoogleConnected, userPicture, currentUser, onGoogleConnect }) => (
  <nav className="app-navbar" style={navbarStyle}>
    <div className="app-logo" style={logoStyle}>
      <img className="logo-mark" src="/logo-mark.png" alt="" width={38} height={33} />
      <span className="logo-wordmark" style={wordmarkStyle}>LEGALVAULT</span>
    </div>
    <div className="app-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {isGoogleConnected ? (
        <span className="nav-google" style={googleStatusStyle}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.emerald }} aria-hidden />
          Google Calendar connected
        </span>
      ) : (
        <Button className="nav-google" appearance="outline" onClick={onGoogleConnect}>
          Connect Google Calendar
        </Button>
      )}
      <span className="nav-google-rule" style={{ width: 1, height: 24, background: C.slate }} />
      <ThemeToggle />
      <Avatar
        name={currentUser}
        color="brand"
        image={userPicture ? { src: userPicture } : undefined}
        title={currentUser}
      />
    </div>
  </nav>
);
