import { useState } from 'react';
import { Card, Body1, Subtitle1, Caption1, Button, Label } from '@fluentui/react-components';
import { useApp } from '../context/AppContext';
import { api } from '../apiService';
import { C, FONT } from '../theme';

const sectionTitleStyle: React.CSSProperties = {
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: `1px solid ${C.slate}`,
  fontFamily: FONT.heading,
};

const pageTitle: React.CSSProperties = {
  fontFamily: FONT.heading,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  color: C.text,
  lineHeight: 1.15,
  margin: '0 0 10px',
};

export function SettingsPage() {
  const { currentUser, isGoogleConnected, showToast } = useApp();
  const [defaultReminder, setDefaultReminder] = useState<string>(
    () => localStorage.getItem('default_reminder') || 'week'
  );

  const handleDefaultReminderChange = (value: string) => {
    setDefaultReminder(value);
    localStorage.setItem('default_reminder', value);
    showToast('Default reminder saved');
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await api.connectGoogle();
      if (res.data.url) window.open(res.data.url, 'google-auth', 'width=500,height=600');
    } catch {
      showToast('Could not open Google sign-in', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const googleStatusText = isGoogleConnected
    ? 'Connected. Reminders sync to your calendar.'
    : 'Not connected';

  return (
    <>
      <h1 style={pageTitle}>Settings</h1>
      <Body1 block style={{ color: C.muted, marginBottom: 32 }}>
        Manage your account and preferences.
      </Body1>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={sectionTitleStyle}>Account</Subtitle1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Caption1 block style={{ fontWeight: 700, color: C.text }}>Username</Caption1>
              <Body1 block style={{ fontSize: 14, color: C.muted }}>{currentUser}</Body1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Caption1 block style={{ fontWeight: 700, color: C.text }}>Google Calendar</Caption1>
              <Body1 block style={{ fontSize: 14, color: C.muted }}>{googleStatusText}</Body1>
            </div>
            <Button
              appearance="outline"
              onClick={handleConnectGoogle}
            >
              {isGoogleConnected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={sectionTitleStyle}>Notifications</Subtitle1>
        <Label style={{ display: 'block', marginBottom: 8 }}>Default reminder for new contracts</Label>
        <Body1 block style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>
          When you upload a new contract, this reminder will be pre-selected (you can change it per contract).
        </Body1>
        <select
          value={defaultReminder}
          onChange={(e) => handleDefaultReminderChange(e.target.value)}
          style={{ alignSelf: 'flex-start', minWidth: 220, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.lineStrong}`, fontSize: 14, background: C.slate, color: C.text }}
        >
          <option value="none">No default reminder</option>
          <option value="week">1 week before expiry</option>
          <option value="month">1 month before expiry</option>
        </select>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={sectionTitleStyle}>Session</Subtitle1>
        <Body1 block style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>
          Sign out of LegalVault on this device. You will need to sign in again to access your contracts.
        </Body1>
        <Button
          appearance="primary"
          onClick={handleLogout}
          style={{ alignSelf: 'flex-start', background: C.dangerStrong, color: '#fff' }}
        >
          Log out
        </Button>
      </Card>
    </>
  );
}
