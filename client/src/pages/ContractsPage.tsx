import { useState, useEffect, useMemo } from 'react';
import { Body1, Button, Input, Label, Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions } from '@fluentui/react-components';
import { CompactUploadBar } from '../components/CompactUploadBar';
import { ContractCard } from '../components/ContractCard';
import { useApp } from '../context/AppContext';
import { api, type FolderItem } from '../apiService';
import { safeParse } from '../utils/contractHelpers';
import { Layers, Clock, PenLine, ShieldAlert, X, Plus } from 'lucide-react';
import { C, FONT } from '../theme';

const SYSTEM_FOLDERS = [
  { id: 'all', label: 'All', icon: Layers, color: C.emerald },
  { id: 'expires_30', label: 'Expires in 30 days', icon: Clock, color: C.warn },
  { id: 'not_signed', label: 'Not signed', icon: PenLine, color: C.cyber },
  { id: 'red_flag', label: 'Needs review', icon: ShieldAlert, color: C.danger },
] as const;

function getContractIdsInFolder(
  folderId: string,
  customFolders: FolderItem[],
  contracts: { contract_id: string; analysis: string | Record<string, unknown> }[]
): string[] {
  if (folderId === 'all') return contracts.map((c) => c.contract_id);
  if (folderId === 'expires_30') {
    const now = Date.now();
    const in30 = now + 30 * 24 * 60 * 60 * 1000;
    return contracts
      .filter((c) => {
        const d = safeParse(c.analysis);
        if (d.expiry === 'N/A') return false;
        try {
          const t = new Date(d.expiry).getTime();
          return t >= now && t <= in30;
        } catch {
          return false;
        }
      })
      .map((c) => c.contract_id);
  }
  if (folderId === 'not_signed') {
    return contracts.filter((c) => !safeParse(c.analysis).is_signed).map((c) => c.contract_id);
  }
  if (folderId === 'red_flag') {
    return contracts.filter((c) => safeParse(c.analysis).risk_flags?.length > 0).map((c) => c.contract_id);
  }
  const folder = customFolders.find((f) => f.folder_id === folderId);
  return folder?.contract_ids ?? [];
}

function getSelectedFolderLabel(
  selectedFolderId: string,
  customFolders: FolderItem[]
): string {
  if (selectedFolderId === 'all') return 'All contracts';
  const system = SYSTEM_FOLDERS.find((f) => f.id === selectedFolderId);
  if (system) return system.label;
  const custom = customFolders.find((f) => f.folder_id === selectedFolderId);
  return custom?.name ?? 'Folder';
}

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 24,
};

const folderButtonBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 6,
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
  border: `1px solid ${C.slate}`,
  background: C.panel,
  color: C.textSoft,
};

const sectionHeading: React.CSSProperties = {
  fontFamily: FONT.heading,
  fontSize: 18,
  fontWeight: 700,
  color: C.text,
  margin: 0,
};

export function ContractsPage() {
  const {
    currentUser,
    loading,
    handleUpload,
    handleUploadFile,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredAndSortedHistory,
    handleDeleteContract,
    handleFileClick,
    setSelectedAnalysis,
    handleNotificationChange,
    isGoogleConnected,
    showToast,
  } = useApp();

  const [customFolders, setCustomFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#14B8A6');
  const [newFolderSymbol, setNewFolderSymbol] = useState('📁');
  const [savingFolder, setSavingFolder] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    api
      .getFolders()
      .then((r) => setCustomFolders(r.data.folders || []))
      .catch(() => setCustomFolders([]));
  }, [currentUser]);

  const contractIdsInSelectedFolder = useMemo(
    () => getContractIdsInFolder(selectedFolderId, customFolders, filteredAndSortedHistory),
    [selectedFolderId, customFolders, filteredAndSortedHistory]
  );

  const displayContracts = useMemo(() => {
    const idSet = new Set(contractIdsInSelectedFolder);
    return filteredAndSortedHistory.filter((c) => idSet.has(c.contract_id));
  }, [filteredAndSortedHistory, contractIdsInSelectedFolder]);

  const selectedFolderLabel = getSelectedFolderLabel(selectedFolderId, customFolders);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim() || 'New folder';
    setSavingFolder(true);
    try {
      await api.createFolder({ name, color: newFolderColor, symbol: newFolderSymbol });
      const res = await api.getFolders();
      setCustomFolders(res.data.folders || []);
      setFolderModalOpen(false);
      setNewFolderName('');
      setNewFolderColor('#14B8A6');
      setNewFolderSymbol('📁');
      showToast('Folder created');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? String((e as { response?: { data?: unknown } }).response?.data)
        : 'Failed to create folder';
      showToast(msg, 'error');
    } finally {
      setSavingFolder(false);
    }
  };

  const handleUpdateFolderContracts = async (folderId: string, contractId: string, add: boolean) => {
    const folder = customFolders.find((f) => f.folder_id === folderId);
    if (!folder) return;
    const ids = add
      ? [...(folder.contract_ids || []), contractId].filter((id, i, a) => a.indexOf(id) === i)
      : (folder.contract_ids || []).filter((id) => id !== contractId);
    try {
      await api.updateFolder(folderId, { contract_ids: ids });
      setCustomFolders((prev) => prev.map((f) => (f.folder_id === folderId ? { ...f, contract_ids: ids } : f)));
      showToast(add ? 'Added to folder' : 'Removed from folder');
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await api.deleteFolder(folderId);
      setCustomFolders((prev) => prev.filter((f) => f.folder_id !== folderId));
      if (selectedFolderId === folderId) setSelectedFolderId('all');
      showToast('Folder deleted');
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const getFolderCount = (folderId: string) =>
    getContractIdsInFolder(folderId, customFolders, filteredAndSortedHistory).length;

  return (
    <>
      <CompactUploadBar loading={loading} onUpload={handleUpload} onFileDrop={handleUploadFile} />

      <div style={filterBarStyle}>
        <Input
          type="text"
          placeholder="Search by party, subject or file name"
          value={searchTerm}
          onChange={(_, d) => setSearchTerm(d.value)}
          style={{ minWidth: 300 }}
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Body1 style={{ color: C.muted, fontWeight: 500 }}>Sort by</Body1>
          <select
            style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.lineStrong}`, fontSize: 14, background: C.slate, color: C.text }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'alphabetical' | 'expiry')}
          >
            <option value="timestamp">Upload date</option>
            <option value="alphabetical">Company (A-Z)</option>
            <option value="expiry">Expiration</option>
          </select>
        </div>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ ...sectionHeading, marginBottom: 12 }}>Folders</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {SYSTEM_FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFolderId(f.id)}
              style={{
                ...folderButtonBase,
                border: `1px solid ${selectedFolderId === f.id ? f.color : C.slate}`,
                background: selectedFolderId === f.id ? `${f.color}1A` : C.panel,
                color: selectedFolderId === f.id ? C.text : C.textSoft,
              }}
              aria-pressed={selectedFolderId === f.id}
            >
              <f.icon size={16} strokeWidth={2} color={f.color} aria-hidden />
              {f.label}
              {f.id !== 'all' && (
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.muted }}>{getFolderCount(f.id)}</span>
              )}
            </button>
          ))}
          {customFolders.map((f) => (
            <div key={f.folder_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
              <button
                type="button"
                onClick={() => setSelectedFolderId(f.folder_id)}
                style={{
                  ...folderButtonBase,
                  borderRadius: '6px 0 0 6px',
                  border: `1px solid ${selectedFolderId === f.folder_id ? f.color : C.slate}`,
                  borderRight: 'none',
                  background: selectedFolderId === f.folder_id ? `${f.color}1A` : C.panel,
                  color: selectedFolderId === f.folder_id ? C.text : C.textSoft,
                }}
                aria-pressed={selectedFolderId === f.folder_id}
              >
                <span>{f.symbol || '📁'}</span>
                {f.name}
                <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.muted }}>{(f.contract_ids || []).length}</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.folder_id); }}
                title="Delete folder"
                aria-label={`Delete folder ${f.name}`}
                style={{
                  ...folderButtonBase,
                  padding: '8px 9px',
                  borderRadius: '0 6px 6px 0',
                  border: `1px solid ${selectedFolderId === f.folder_id ? f.color : C.slate}`,
                  borderLeft: 'none',
                  background: selectedFolderId === f.folder_id ? `${f.color}1A` : C.panel,
                  color: C.faint,
                }}
              >
                <X size={14} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
          <Dialog
            open={folderModalOpen}
            onOpenChange={(_, d) => {
              setFolderModalOpen(d.open);
              if (d.open) {
                setNewFolderName('');
                setNewFolderColor('#14B8A6');
                setNewFolderSymbol('📁');
              }
            }}
          >
            <DialogTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<Plus size={16} strokeWidth={2} />}
                style={{ border: `1px dashed ${C.lineStrong}`, color: C.muted, borderRadius: 6 }}
              >
                New folder
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogTitle>New folder</DialogTitle>
              <DialogBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newFolderName}
                      onChange={(_, d) => setNewFolderName(d.value)}
                      placeholder="e.g. Vendors"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={newFolderColor}
                        onChange={(e) => setNewFolderColor(e.target.value)}
                        style={{ width: 44, height: 44, padding: 2, borderRadius: 6, border: `1px solid ${C.lineStrong}`, background: C.slate, cursor: 'pointer' }}
                      />
                      <Input
                        value={newFolderColor}
                        onChange={(_, d) => setNewFolderColor(d.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Symbol (emoji)</Label>
                    <Input
                      value={newFolderSymbol}
                      onChange={(_, d) => setNewFolderSymbol(d.value.slice(0, 2))}
                      placeholder="📁"
                    />
                  </div>
                </div>
              </DialogBody>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setFolderModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button appearance="primary" onClick={handleCreateFolder} disabled={savingFolder}>
                  {savingFolder ? 'Creating…' : 'Create folder'}
                </Button>
              </DialogActions>
            </DialogSurface>
          </Dialog>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={sectionHeading}>{selectedFolderLabel}</h2>
          <Body1 style={{ color: C.muted, fontFamily: FONT.mono, fontSize: 13 }}>
            {displayContracts.length} {displayContracts.length === 1 ? 'contract' : 'contracts'}
          </Body1>
        </div>
        {displayContracts.length === 0 && (
          <p style={{ margin: 0, padding: '22px 24px', border: `1px solid ${C.slate}`, borderRadius: 10, background: C.panel, color: C.muted, fontSize: 15 }}>
            {filteredAndSortedHistory.length === 0 ? 'No contracts yet. Drop a PDF above to add your first one.' : 'No contracts match this folder or search.'}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {displayContracts.map((c) => (
            <ContractCard
              key={c.contract_id}
              contract={c}
              onDelete={handleDeleteContract}
              onFileClick={handleFileClick}
              onViewInsights={setSelectedAnalysis}
              onReminderChange={handleNotificationChange}
              isGoogleConnected={isGoogleConnected}
              customFolders={customFolders}
              onAddToFolder={handleUpdateFolderContracts}
            />
          ))}
        </div>
      </section>
    </>
  );
}
