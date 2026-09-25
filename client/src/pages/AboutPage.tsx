import { C, FONT } from '../theme';
import {
  Card,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
} from '@fluentui/react-components';

const codeBlockStyle: React.CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 13,
  background: C.vault,
  color: C.textSoft,
  padding: 20,
  borderRadius: 8,
  overflow: 'auto',
  lineHeight: 1.6,
  margin: 0,
  border: `1px solid ${C.slate}`,
};

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 13,
  background: C.slate,
  color: C.text,
  padding: '2px 7px',
  borderRadius: 4,
};

const cmdStyle: React.CSSProperties = { ...codeBlockStyle, padding: 14 };

const pageTitle: React.CSSProperties = {
  fontFamily: FONT.heading,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  color: C.text,
  lineHeight: 1.15,
  margin: '0 0 10px',
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: C.textSoft,
  lineHeight: 1.8,
};

export function AboutPage() {
  return (
    <>
      <h1 style={pageTitle}>About LegalVault</h1>
      <Body1 block style={{ color: C.muted, marginBottom: 24 }}>
        An intelligent contract analysis platform powered by AI.
      </Body1>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>What is LegalVault?</Subtitle1>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, margin: 0 }}>
          LegalVault is an intelligent contract management platform that transforms static PDF documents into dynamic, actionable data. By leveraging state-of-the-art Natural Language Processing (NLP), the platform automatically extracts key terms, deadlines, and financial liabilities, presenting them in a clean, intuitive dashboard.
        </Body1>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>Key features</Subtitle1>
        <ul style={listStyle}>
          <li><strong>AI-Powered Analysis:</strong> Instant extraction of parties, subjects, and critical clauses using GPT-4o-mini.</li>
          <li><strong>Deadline Automation:</strong> Seamless synchronization with Google Calendar and daily email reminders via AWS SES to ensure you never miss a renewal or termination date.</li>
          <li><strong>Risk Detection:</strong> Automatically flags potential “Red Flags” like hidden penalties or restrictive exclusivity clauses.</li>
          <li><strong>Financial Insights:</strong> Real-time analytics of your contractual liabilities and upcoming payments.</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>Tech stack</Subtitle1>
        <Subtitle2 block style={{ marginTop: 20, marginBottom: 8 }}>Frontend</Subtitle2>
        <ul style={{ ...listStyle, marginBottom: 16 }}>
          <li><strong>React 19</strong> with TypeScript</li>
          <li><strong>Vite</strong> (Rolldown) for build and dev server</li>
          <li><strong>React Router</strong> for client-side routing (Home, Contracts, Analytics, Settings, About)</li>
          <li><strong>Fluent UI</strong> (React components)</li>
          <li><strong>Axios</strong> for API calls</li>
          <li>Plus Jakarta Sans, Inter and JetBrains Mono typography on the LegalVault dark theme</li>
        </ul>
        <Subtitle2 block style={{ marginTop: 20, marginBottom: 8 }}>Backend</Subtitle2>
        <ul style={listStyle}>
          <li><strong>Python 3.9+</strong>, <strong>FastAPI</strong>, <strong>Uvicorn</strong></li>
          <li><strong>PyMuPDF (fitz)</strong> for PDF text extraction</li>
          <li><strong>OpenAI GPT-4o-mini</strong> for contract analysis (subject, party, expiry, summary, risk flags, signed status)</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>AWS &amp; external services</Subtitle1>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, margin: '0 0 16px' }}>
          Storage and reminders use AWS and Google. <strong>Expiration email reminders</strong> are sent via AWS serverless: a week before a contract expires, the system sends a daily reminder at <strong>8:00</strong> until the expiry date.
        </Body1>
        <ul style={listStyle}>
          <li><strong>AWS DynamoDB</strong>: users, analyzed contracts, custom folders</li>
          <li><strong>AWS S3</strong>: PDF storage</li>
          <li><strong>AWS Lambda</strong>: runs on a schedule to find contracts expiring in 7 days and triggers the email flow</li>
          <li><strong>Amazon EventBridge</strong>: runs the job daily at 8:00 so Lambda is invoked without a dedicated server</li>
          <li><strong>Amazon SES</strong>: sends the reminder emails to users</li>
          <li><strong>Google Calendar API</strong> + OAuth 2.0: in-app expiration reminders synced to the user’s calendar</li>
        </ul>
        <Caption1 block style={{ color: C.muted, marginTop: 16, marginBottom: 0 }}>
          EventBridge triggers Lambda at 8:00 each day; Lambda queries contracts expiring within a week and uses SES to email the relevant users.
        </Caption1>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>Project structure</Subtitle1>
        <pre style={codeBlockStyle}>
          {`contract_manager/
├── backend/
│   ├── main.py              # FastAPI app, CORS, /view/{id}/pdf, /update-reminder
│   ├── config.py            # AWS, OpenAI, auth config
│   ├── models.py            # Pydantic models
│   ├── requirements.txt
│   ├── routers/
│   │   ├── auth.py          # /signup, /login (JWT)
│   │   ├── contracts.py     # /contracts/upload, GET /, DELETE /{id}
│   │   ├── folders.py       # Custom folders CRUD
│   │   └── google_auth.py   # /auth/google, /auth/callback
│   └── services/
│       ├── ai_service.py    # OpenAI contract analysis (JSON)
│       ├── auth_service.py  # Password hashing, JWT
│       └── calendar_service.py # Google Calendar events
├── client/
│   ├── src/
│   │   ├── main.tsx         # React root, FluentProvider, BrowserRouter
│   │   ├── App.tsx          # Auth + routes, context, modals
│   │   ├── AppStyles.ts     # Shared styles
│   │   ├── apiService.ts    # API client, JWT
│   │   ├── context/AppContext.tsx
│   │   ├── layouts/AppLayout.tsx
│   │   ├── pages/           # Home, Contracts, Analytics, Settings, About
│   │   ├── components/     # Navbar, ContractCard, DashboardHeader, etc.
│   │   └── utils/contractHelpers.ts
│   ├── package.json
│   └── vite.config.ts
└── README.md`}
        </pre>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>Build and run</Subtitle1>
        <Subtitle2 block style={{ marginTop: 20, marginBottom: 8 }}>Backend</Subtitle2>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, margin: '0 0 12px' }}>
          From <span style={inlineCodeStyle}>backend/</span>: create a <span style={inlineCodeStyle}>.env</span> with AWS keys,
          S3 bucket, OpenAI API key, and Google OAuth credentials. Create DynamoDB tables (Users, Analyzed_Contracts,
          Contract_Folders). Then:
        </Body1>
        <pre style={{ ...cmdStyle, margin: '0 0 16px' }}>
          {`python -m venv venv
source venv/bin/activate   # or venv\\Scripts\\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload`}
        </pre>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, margin: 0 }}>
          API runs at <span style={inlineCodeStyle}>http://localhost:8000</span>.
        </Body1>
        <Subtitle2 block style={{ marginTop: 20, marginBottom: 8 }}>Frontend</Subtitle2>
        <pre style={cmdStyle}>
          {`cd client
npm install
npm run dev`}
        </pre>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>
          App runs at <span style={inlineCodeStyle}>http://localhost:5173</span>. Set <span style={inlineCodeStyle}>VITE_API_BASE</span> if the backend is elsewhere.
        </Body1>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Subtitle1 block style={{ marginBottom: 12 }}>About the developer</Subtitle1>
        <Body1 block style={{ color: C.textSoft, lineHeight: 1.7, margin: 0 }}>
          <strong>Arad P.</strong> I am a Computer Science student at the Academic College of Tel Aviv-Yaffo, passionate about Software Engineering and Cloud Computing. This project was born out of my desire to combine AI capabilities with robust cloud infrastructure to solve real-world administrative challenges.
        </Body1>
      </Card>
    </>
  );
}
