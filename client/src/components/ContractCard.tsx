import React, { useState } from 'react';
import * as S from '../AppStyles';
import { safeParse, riskFlagLabel } from '../utils/contractHelpers';
import type { FolderItem } from '../apiService';
import { FileText, Sparkles, FolderPlus, Check } from 'lucide-react';
import { C } from '../theme';

interface ContractCardProps {
  contract: any;
  onDelete: (id: string) => void;
  onFileClick: (id: string, e: React.MouseEvent) => void;
  onViewInsights: (summary: string) => void;
  onReminderChange: (id: string, setting: string) => void;
  isGoogleConnected: boolean;
  customFolders?: FolderItem[];
  onAddToFolder?: (folderId: string, contractId: string, add: boolean) => void;
  compact?: boolean;
}

function getSummaryText(details: ReturnType<typeof safeParse>): string {
  return typeof details.summary === 'string' ? details.summary : 'No summary.';
}

function getCardConclusion(details: ReturnType<typeof safeParse>, summaryText: string): string {
  const conclusion = details.conclusion?.trim();
  if (conclusion) return conclusion;
  if (summaryText.length > 120) {
    return `${summaryText.substring(0, 120).replace(/\n/g, ' ')}...`;
  }
  return summaryText.replace(/\n/g, ' ');
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onDelete,
  onFileClick,
  onViewInsights,
  onReminderChange,
  isGoogleConnected,
  customFolders = [],
  onAddToFolder,
  compact = false,
}) => {
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const details = safeParse(contract.analysis);
  const summaryText = getSummaryText(details);
  const cardConclusion = getCardConclusion(details, summaryText);

  const isInFolder = (f: FolderItem) => (f.contract_ids || []).includes(contract.contract_id);

  const cardStyleFinal = compact ? { ...S.cardStyle, padding: '12px', borderRadius: 8 } : S.cardStyle;
  const cardPartyFinal = compact ? { ...S.cardParty, fontSize: 15 } : S.cardParty;
  const cardSummaryFinal = compact ? { ...S.cardSummary, fontSize: 13 } : S.cardSummary;
  const cardMetaFinal = compact ? { ...S.cardMeta, marginTop: 12, padding: '10px 0' } : S.cardMeta;
  const cardActionsFinal = compact ? { ...S.cardActions, marginTop: 10, gap: 6, flexWrap: 'wrap' as const } : S.cardActions;
  const notSignedStyle = {
    marginTop: 10, padding: compact ? '3px 8px' : '4px 10px', borderRadius: 4, background: C.warnSoft,
    border: `1px solid ${C.warn}33`, fontSize: compact ? 11.5 : 12.5, fontWeight: 500, color: C.warn,
    display: 'inline-block' as const, width: 'fit-content',
  };
  const alertSelectStyle = compact ? { ...S.miniSelect, width: 72, minWidth: 72, padding: '6px 6px' } : { ...S.miniSelect, width: 88, minWidth: 88 };

  return (
    <div style={cardStyleFinal} className="card-hover">
      <div style={S.cardTop}>
        <span style={S.typeBadge}>{details.subject}</span>
        <button
          type="button"
          onClick={() => onDelete(contract.contract_id)}
          className="delete-trigger"
          title="Delete Contract"
          style={{ marginRight: -6, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Delete contract"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="trash-lid" d="M15 4V3C15 2.44772 14.5523 2 14 2H10C9.44772 2 9 2.44772 9 3V4H4V6H20V4H15ZM11 4V3H13V4H11Z" />
            <path className="trash-base" fillRule="evenodd" clipRule="evenodd" d="M5 8V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V8H5ZM9 10H7V19H9V10ZM13 10H11V19H13V10ZM17 10H15V19H17V10Z" />
          </svg>
        </button>
      </div>

      <h3 style={cardPartyFinal}>{details.party}</h3>
      <p style={cardSummaryFinal}>{cardConclusion}</p>

      <div style={cardMetaFinal}>
        <div style={S.metaCell}>
          <span style={S.metaLabel}>Uploaded</span>
          <span style={S.metaValue}>{new Date(contract.timestamp).toLocaleDateString()}</span>
        </div>
        <div style={S.metaCell}>
          <span style={S.metaLabel}>Expires</span>
          <span style={{ ...S.metaValue, color: details.expiry !== 'N/A' ? C.text : C.faint }}>
            {details.expiry}
          </span>
        </div>
      </div>

      {!details.is_signed && (
        <div style={notSignedStyle}>Not signed</div>
      )}

      {details.risk_flags && details.risk_flags.length > 0 && (
        <div style={{ marginTop: compact ? 8 : 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.danger, marginBottom: 6 }}>Needs review</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
            {details.risk_flags.map((flag) => (
              <span
                key={flag}
                style={{ background: C.dangerSoft, color: C.danger, border: `1px solid ${C.danger}33`, padding: compact ? '2px 7px' : '3px 9px', borderRadius: 4, fontSize: compact ? 11 : 12, fontWeight: 500 }}
              >
                {riskFlagLabel(flag)}
              </span>
            ))}
          </div>
          {'risk_flags_note' in details && details.risk_flags_note && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted, lineHeight: 1.45 }}>{String(details.risk_flags_note)}</p>
          )}
        </div>
      )}

      <div style={cardActionsFinal}>
        <button type="button" onClick={(e) => onFileClick(contract.contract_id, e)} style={S.viewPdfBtn}>
          <FileText size={15} strokeWidth={2} aria-hidden /> View PDF
        </button>
        <button type="button" onClick={() => onViewInsights(summaryText)} style={S.secondaryBtn}>
          <Sparkles size={15} strokeWidth={2} aria-hidden /> Insights
        </button>
        {isGoogleConnected && (
          <select
            value={contract.reminder_setting || 'none'}
            onChange={(e) => onReminderChange(contract.contract_id, e.target.value)}
            style={alertSelectStyle}
          >
            <option value="none">No alert</option>
            <option value="week">1 week</option>
            <option value="month">1 month</option>
          </select>
        )}
      </div>

      {customFolders.length > 0 && onAddToFolder && (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setFolderMenuOpen((o) => !o)}
            style={{ ...S.miniSelect, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FolderPlus size={15} strokeWidth={2} aria-hidden /> Add to folder
          </button>
          {folderMenuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setFolderMenuOpen(false)} aria-hidden />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: C.slate,
                  borderRadius: 8,
                  border: `1px solid ${C.lineStrong}`,
                  boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                  zIndex: 11,
                  padding: 6,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                {customFolders.map((f) => {
                  const inFolder = isInFolder(f);
                  return (
                    <button
                      key={f.folder_id}
                      type="button"
                      onClick={() => { onAddToFolder(f.folder_id, contract.contract_id, !inFolder); setFolderMenuOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 6,
                        background: inFolder ? `${f.color}26` : 'transparent',
                        color: C.text,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ width: 14, display: 'inline-flex' }}>{inFolder && <Check size={14} strokeWidth={2.5} aria-hidden />}</span>
                      <span>{f.symbol || '📁'}</span>
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
