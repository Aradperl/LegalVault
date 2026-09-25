import React, { useState } from 'react';
import { Title1, Body1, Input, Card } from '@fluentui/react-components';
import { FileUp, Loader2 } from 'lucide-react';
import * as S from '../AppStyles';
import { C } from '../theme';

interface DashboardHeaderProps {
  loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  sortBy?: string;
  onSortChange?: (val: string) => void;
  showFilterBar?: boolean;
}

function preventDefault(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  loading,
  onUpload,
  onFileDrop,
  searchTerm = '',
  onSearchChange = () => {},
  sortBy = 'timestamp',
  onSortChange = () => {},
  showFilterBar = true,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    preventDefault(e);
    if (!loading) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    preventDefault(e);
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    preventDefault(e);
    setDragActive(false);
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      onFileDrop(file);
    }
  };

  const uploadLabelText = loading ? 'Reading your contract…' : 'Drop a PDF here, or click to choose a file';

  return (
    <>
      <header style={S.heroSection}>
        <Title1 block style={S.heroTitle as React.CSSProperties}>
          Add a contract to your vault
        </Title1>
        <Body1 block style={S.heroSub as React.CSSProperties}>
          Upload a PDF. LegalVault pulls out the parties, dates and fees, flags risky terms, and keeps track of the deadlines.
        </Body1>
        <Card
          style={{ ...S.uploadArea, ...(dragActive ? S.uploadAreaDragActive : {}) }}
          className={loading ? 'loading' : ''}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {loading && <div className="scanner-line" />}
          <input
            type="file"
            id="file"
            accept="application/pdf,.pdf"
            onChange={onUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="file" style={{ ...S.uploadLabel, cursor: 'pointer', margin: 0 }}>
            <div style={S.iconCircle}>
              {loading ? <Loader2 size={24} strokeWidth={2} className="spin" aria-hidden /> : <FileUp size={24} strokeWidth={2} aria-hidden />}
            </div>
            <span style={{ fontWeight: 600, color: C.text }}>{uploadLabelText}</span>
            {!loading && <span style={{ fontSize: 13, color: C.faint }}>PDF files only</span>}
          </label>
        </Card>
      </header>

      {showFilterBar && (
        <div style={S.filterBarContainer}>
          <Input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(_, d) => onSearchChange(d.value)}
            style={{ minWidth: 240 }}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Body1 style={{ color: C.muted, fontWeight: 500 }}>Sort by</Body1>
            <select
              style={S.sortSelectStyle}
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="timestamp">Upload date</option>
              <option value="alphabetical">Company (A-Z)</option>
              <option value="expiry">Expiration</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};
