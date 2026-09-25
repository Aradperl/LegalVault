import React, { useState } from 'react';
import { Title1, Body1, Input, Card } from '@fluentui/react-components';
import * as S from '../AppStyles';

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

  const uploadLabelText = loading ? 'AI is analyzing document...' : 'Click to upload or drag & drop a PDF';

  return (
    <>
      <header style={S.heroSection}>
        <Title1 block style={S.heroTitle as React.CSSProperties}>
          Your Contracts, <span style={S.gradientText}>Simplified.</span>
        </Title1>
        <Body1 block style={S.heroSub as React.CSSProperties}>
          Upload PDFs and let AI extract key insights and manage deadlines for you.
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
            <div style={S.iconCircle}>{loading ? '⚙️' : '📁'}</div>
            <span style={{ fontWeight: 600 }}>{uploadLabelText}</span>
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
            <Body1 style={{ color: '#64748b', fontWeight: 600 }}>Sort by:</Body1>
            <select
              style={S.sortSelectStyle}
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="timestamp">Upload Date</option>
              <option value="alphabetical">Company (A-Z)</option>
              <option value="expiry">Expiration</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};
