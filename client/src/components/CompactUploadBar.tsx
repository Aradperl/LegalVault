import { useState } from 'react';
import { Card, Body1 } from '@fluentui/react-components';
import { FileUp, Loader2 } from 'lucide-react';
import * as S from '../AppStyles';
import { C } from '../theme';

interface CompactUploadBarProps {
  loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (file: File) => void;
}

function preventDefault(e: React.DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function CompactUploadBar({ loading, onUpload, onFileDrop }: CompactUploadBarProps) {
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

  const labelText = loading ? 'Reading your contract…' : 'Add a contract: drop a PDF here or click to choose';

  return (
    <Card
      style={{
        ...S.uploadArea,
        ...(dragActive ? S.uploadAreaDragActive : {}),
        padding: '16px 24px',
        marginTop: 0,
        marginBottom: 24,
        borderRadius: 10,
      }}
      className={loading ? 'loading' : ''}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {loading && <div className="scanner-line" />}
      <input
        type="file"
        id="compact-file"
        accept="application/pdf,.pdf"
        onChange={onUpload}
        style={{ display: 'none' }}
      />
      <label
        htmlFor="compact-file"
        style={{ ...S.uploadLabel, flexDirection: 'row', cursor: 'pointer', margin: 0 }}
      >
        <div style={{ ...S.iconCircle, width: 40, height: 40, marginBottom: 0 }}>
          {loading ? <Loader2 size={20} strokeWidth={2} className="spin" aria-hidden /> : <FileUp size={20} strokeWidth={2} aria-hidden />}
        </div>
        <Body1 style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{labelText}</Body1>
      </label>
    </Card>
  );
}
