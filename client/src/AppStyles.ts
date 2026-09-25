import React from 'react';
import { C, FONT } from './theme';

// --- Layout ---
export const filterBarContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    gap: '20px',
    flexWrap: 'wrap'
};

// --- Hero & Upload ---
export const heroSection: React.CSSProperties = {
    maxWidth: '760px',
    margin: '0 0 48px 0',
    paddingTop: '8px'
};

export const heroTitle: React.CSSProperties = {
    fontFamily: FONT.heading,
    fontSize: 'clamp(30px, 3.6vw, 42px)',
    fontWeight: '800',
    color: C.text,
    margin: '0 0 12px 0',
    letterSpacing: '-0.03em',
    lineHeight: 1.1
};

export const heroSub: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: '16px',
    color: C.muted,
    lineHeight: 1.6,
    maxWidth: '560px'
};

export const uploadArea: React.CSSProperties = {
    position: 'relative',
    background: C.panel,
    border: `1.5px dashed ${C.lineStrong}`,
    borderRadius: '10px',
    padding: '36px',
    marginTop: '28px',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
    cursor: 'pointer',
    overflow: 'hidden',
    boxShadow: 'none'
};

export const uploadAreaDragActive: React.CSSProperties = {
    borderColor: C.emerald,
    background: C.emeraldSoft
};

export const uploadLabel: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: C.textSoft
};

export const iconCircle: React.CSSProperties = {
    width: '52px',
    height: '52px',
    background: C.slate,
    color: C.emerald,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
};

// --- Contract Card ---
export const cardStyle: React.CSSProperties = {
    background: C.panel,
    borderRadius: '10px',
    padding: '22px',
    border: `1px solid ${C.slate}`,
    display: 'flex',
    flexDirection: 'column',
    color: C.text
};

export const cardTop: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
};

export const typeBadge: React.CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: '11.5px',
    fontWeight: '500',
    color: C.emerald,
    background: C.emeraldSoft,
    padding: '4px 8px',
    borderRadius: '4px',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
};

export const cardParty: React.CSSProperties = {
    fontFamily: FONT.heading,
    fontSize: '20px',
    fontWeight: '700',
    color: C.text,
    margin: '4px 0 8px 0',
    letterSpacing: '-0.015em'
};

export const cardSummary: React.CSSProperties = {
    fontSize: '14px',
    color: C.muted,
    lineHeight: '1.55',
    margin: 0,
    flex: 1
};

export const cardMeta: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px 20px',
    marginTop: '18px',
    padding: '12px 0',
    borderTop: `1px solid ${C.slate}`,
    borderBottom: `1px solid ${C.slate}`,
    alignItems: 'center'
};

export const metaCell: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: 0
};
export const metaLabel: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '500',
    color: C.faint
};
export const metaValue: React.CSSProperties = {
    fontFamily: FONT.mono,
    fontSize: '12.5px',
    fontWeight: '500',
    color: C.textSoft
};

export const cardActions: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '16px'
};

// --- Buttons & Inputs ---
export const viewPdfBtn: React.CSSProperties = {
    flex: 1, padding: '9px 10px', borderRadius: '6px', border: `1px solid ${C.lineStrong}`,
    background: C.slate, color: C.text, fontWeight: '600', cursor: 'pointer', fontSize: '13px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
};

export const secondaryBtn: React.CSSProperties = {
    flex: 1, padding: '9px 10px', borderRadius: '6px', border: `1px solid ${C.lineStrong}`,
    background: 'transparent', color: C.text, fontWeight: '600', cursor: 'pointer', fontSize: '13px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
};

export const miniSelect: React.CSSProperties = {
    padding: '8px', borderRadius: '6px', border: `1px solid ${C.lineStrong}`, fontSize: '12px',
    background: C.slate, color: C.text, cursor: 'pointer'
};

export const sortSelectStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.lineStrong}`,
    background: C.slate, color: C.text, fontSize: '14px', fontWeight: '500', outline: 'none', cursor: 'pointer'
};

// --- Modal ---
export const modalOverlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(5, 8, 14, 0.75)', backdropFilter: 'blur(6px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px'
};

export const modalContent: React.CSSProperties = {
    background: C.panel, width: '100%', maxWidth: '620px', borderRadius: '12px',
    border: `1px solid ${C.slate}`, padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    maxHeight: '85vh', overflowY: 'auto'
};

export const modalHeader: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'
};

export const modalBody: React.CSSProperties = {
    paddingTop: '4px'
};

// Insights content (rendered inside modal body)
export const insightsBlock: React.CSSProperties = {
    fontSize: '15px',
    color: C.textSoft,
    lineHeight: 1.65,
    marginBottom: '16px'
};

export const insightsHeading: React.CSSProperties = {
    fontFamily: FONT.heading,
    fontSize: '15px',
    fontWeight: '700',
    color: C.emerald,
    marginBottom: '6px',
    marginTop: '18px'
};

export const insightsList: React.CSSProperties = {
    margin: '0 0 12px 0',
    paddingLeft: '20px'
};

export const insightsListItem: React.CSSProperties = {
    marginBottom: '6px',
    color: C.textSoft
};

export const insightsParagraph: React.CSSProperties = {
    margin: '0 0 10px 0',
    color: C.textSoft
};

export const insightsBold: React.CSSProperties = {
    fontWeight: '600',
    color: C.text
};

// Delete confirmation modal
export const deleteModalCard: React.CSSProperties = {
    background: C.panel, border: `1px solid ${C.slate}`, borderRadius: '12px', padding: '32px 28px',
    maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
};
export const deleteModalIcon: React.CSSProperties = {
    width: '52px', height: '52px', borderRadius: '10px', background: C.dangerSoft, color: C.danger,
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
};
export const deleteModalTitle: React.CSSProperties = { fontFamily: FONT.heading, fontSize: '20px', fontWeight: '700', color: C.text, marginBottom: '8px' };
export const deleteModalText: React.CSSProperties = { fontSize: '15px', color: C.muted, marginBottom: '24px', lineHeight: 1.55 };
export const deleteModalActions: React.CSSProperties = { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' };
export const deleteModalCancelBtn: React.CSSProperties = {
    padding: '10px 22px', borderRadius: '6px', fontWeight: '600', fontSize: '15px'
};
export const deleteModalConfirmBtn: React.CSSProperties = {
    padding: '10px 22px', borderRadius: '6px', border: 'none', background: C.dangerStrong,
    color: '#fff', fontWeight: '700', fontSize: '15px'
};

// Toast notification
export const toastContainer: React.CSSProperties = {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100,
    padding: '12px 18px', borderRadius: '8px', fontWeight: '500', fontSize: '14px',
    background: C.slate, color: C.text, border: `1px solid ${C.lineStrong}`,
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)', maxWidth: '90vw', display: 'flex', alignItems: 'center', gap: '10px'
};
export const toastSuccess: React.CSSProperties = { borderLeft: `3px solid ${C.emerald}` };
export const toastError: React.CSSProperties = { borderLeft: `3px solid ${C.danger}` };

// --- Auth result modal ---
export const authSuccessOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(5, 8, 14, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px'
};

export const authSuccessCard: React.CSSProperties = {
    background: C.panel,
    border: `1px solid ${C.slate}`,
    borderRadius: '12px',
    padding: '36px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    animation: 'popIn 0.2s ease-out'
};

const resultIcon: React.CSSProperties = {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px auto',
    fontSize: '24px',
    fontWeight: '700'
};

export const authSuccessIcon: React.CSSProperties = { ...resultIcon, background: C.emeraldSoft, color: C.emerald };
export const authErrorIcon: React.CSSProperties = { ...resultIcon, background: C.dangerSoft, color: C.danger };

export const authSuccessTitle: React.CSSProperties = {
    fontFamily: FONT.heading,
    fontSize: '20px',
    fontWeight: '700',
    color: C.text,
    margin: '0 0 8px 0'
};
export const authErrorTitle = authSuccessTitle;

export const authSuccessText: React.CSSProperties = {
    fontSize: '15px',
    color: C.muted,
    lineHeight: 1.55,
    margin: '0 0 24px 0'
};
export const authErrorText = authSuccessText;

export const authSuccessBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px 20px',
    background: C.teal,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontFamily: FONT.heading,
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer'
};
export const authErrorBtn = authSuccessBtn;
