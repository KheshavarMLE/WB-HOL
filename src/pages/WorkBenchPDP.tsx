import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle, ArrowLeft, ChevronLeft, Edit2, Eye,
  FileText, Globe, Image as ImageIcon, Info,
  Package, Plus, Save, Trash2, Upload, Wrench, X,
  CheckCircle2, LayoutGrid, Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Range, SAPItem, BOMComponent, Specification, SessionData,
  createDefaultRange,
} from '@/types/product';

/* ─── Types ──────────────────────────────────────────────────────────────── */

/** Extended SAPItem with PDP-level overrides (description, price, images, specs) */
interface PDPOverride {
  itemId: string;           // which SAP item this overrides
  pdpName?: string;
  pdpDescription?: string;
  pdpPrice?: string;
  pdpStock?: string;
  pdpPrimaryImage?: string;
  pdpAdditionalImages?: string[];
  pdpSpecifications?: Specification[];
  technicalInfo?: string;
  marketingCopy?: string;
}

type EditPanel = 'none' | 'range' | 'item';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

/* ═══════════════════════════════════════════════════════════════════════════ */

const WorkBenchPDP = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, isValid, updateSession } = useSession(sessionId || null);

  /* ── Core state ── */
  const [ranges, setRanges] = useState<Range[]>([]);
  const [sapItems, setSapItems] = useState<SAPItem[]>([]);
  const [pdpOverrides, setPdpOverrides] = useState<Record<string, PDPOverride>>({});
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const [editPanel, setEditPanel] = useState<EditPanel>('none');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  /* ── Dialog state ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [newRangeName, setNewRangeName] = useState('');
  const [newRangeDesc, setNewRangeDesc] = useState('');

  /* ── Draft state for range & item editing ── */
  const [rangeDraft, setRangeDraft] = useState<Partial<Range & { image?: string }>>({});
  const [itemDraft, setItemDraft] = useState<Partial<PDPOverride>>({});
  const rangeImageRef = useRef<HTMLInputElement>(null);
  const itemPrimaryRef = useRef<HTMLInputElement>(null);
  const itemAddlRef = useRef<HTMLInputElement>(null);

  /* ── Sync from session ── */
  useEffect(() => {
    if (session) {
      setRanges(session.ranges ?? []);
      setSapItems(session.sapItems ?? []);
      setPdpOverrides((session as any).pdpOverrides ?? {});
    }
  }, [session?.ranges, session?.sapItems, (session as any)?.pdpOverrides]);

  /* ── Persist helpers ── */
  const persistAll = useCallback((
    updatedRanges: Range[],
    updatedOverrides: Record<string, PDPOverride>
  ) => {
    if (!session) return;
    setRanges(updatedRanges);
    setPdpOverrides(updatedOverrides);
    updateSession({ ...session, ranges: updatedRanges, pdpOverrides: updatedOverrides } as any);
  }, [session, updateSession]);

  const persistRanges = useCallback((updated: Range[]) => {
    persistAll(updated, pdpOverrides);
  }, [persistAll, pdpOverrides]);

  /* ── Range CRUD ── */
  const handleCreateRange = () => {
    if (!newRangeName.trim()) return;
    const r = createDefaultRange(newRangeName.trim());
    r.description = newRangeDesc.trim();
    const updated = [...ranges, r];
    persistRanges(updated);
    setSelectedRangeId(r.rangeId);
    setNewRangeName(''); setNewRangeDesc('');
    setCreateOpen(false);
    toast.success(`Range "${r.name}" created`);
  };

  const handleDeleteRange = (rangeId: string) => {
    const r = ranges.find(x => x.rangeId === rangeId);
    if (!confirm(`Delete range "${r?.name}"?`)) return;
    persistRanges(ranges.filter(x => x.rangeId !== rangeId));
    if (selectedRangeId === rangeId) { setSelectedRangeId(null); setEditPanel('none'); }
    toast.success('Range deleted');
  };

  /* ── Item assign / remove ── */
  const assignItem = (itemId: string) => {
    if (!selectedRangeId) return;
    persistRanges(ranges.map(r =>
      r.rangeId === selectedRangeId && !r.sapItemIds.includes(itemId)
        ? { ...r, sapItemIds: [...r.sapItemIds, itemId], lastModified: new Date().toISOString() }
        : r
    ));
    toast.success('Item added to range');
  };

  const removeItem = (itemId: string) => {
    if (!selectedRangeId) return;
    persistRanges(ranges.map(r =>
      r.rangeId === selectedRangeId
        ? { ...r, sapItemIds: r.sapItemIds.filter(id => id !== itemId), lastModified: new Date().toISOString() }
        : r
    ));
    toast.success('Item removed from range');
  };

  /* ── Publish ── */
  const togglePublish = (rangeId: string, val: boolean) => {
    persistRanges(ranges.map(r =>
      r.rangeId === rangeId
        ? { ...r, isPublished: val, publishedAt: val ? new Date().toISOString() : undefined, lastModified: new Date().toISOString() }
        : r
    ));
    toast.success(val ? '✓ Range published to Web View' : 'Range unpublished');
  };

  /* ── Open range edit panel ── */
  const openRangeEdit = () => {
    if (!selectedRange) return;
    setRangeDraft({ ...selectedRange, image: (selectedRange as any).image });
    setEditPanel('range');
  };

  /* ── Save range edits ── */
  const saveRangeDraft = () => {
    if (!selectedRangeId) return;
    persistRanges(ranges.map(r =>
      r.rangeId === selectedRangeId ? { ...r, ...rangeDraft, lastModified: new Date().toISOString() } : r
    ));
    setEditPanel('none');
    toast.success('Range updated');
  };

  /* ── Open item edit panel ── */
  const openItemEdit = (itemId: string) => {
    setEditingItemId(itemId);
    const existing = pdpOverrides[itemId] ?? { itemId };
    setItemDraft({ ...existing });
    setEditPanel('item');
  };

  /* ── Save item PDP edits ── */
  const saveItemDraft = () => {
    if (!editingItemId) return;
    const updated = { ...pdpOverrides, [editingItemId]: { ...itemDraft, itemId: editingItemId } as PDPOverride };
    persistAll(ranges, updated);
    setEditPanel('none');
    toast.success('Item details updated');
  };

  /* ── Image helpers for range ── */
  const handleRangeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const b64 = await toBase64(file);
    setRangeDraft(d => ({ ...d, image: b64 }));
    e.target.value = '';
  };

  /* ── Image helpers for item PDP ── */
  const handleItemPrimary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const b64 = await toBase64(file);
    setItemDraft(d => ({ ...d, pdpPrimaryImage: b64 }));
    e.target.value = '';
  };

  const handleItemAddl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const results = await Promise.all(Array.from(files).map(toBase64));
    setItemDraft(d => ({ ...d, pdpAdditionalImages: [...(d.pdpAdditionalImages ?? []), ...results] }));
    e.target.value = '';
  };

  const removeAddlImage = (idx: number) => {
    setItemDraft(d => ({ ...d, pdpAdditionalImages: d.pdpAdditionalImages?.filter((_, i) => i !== idx) }));
  };

  /* ── Spec helpers inside item draft ── */
  const addItemSpec = () => {
    const spec: Specification = { id: `spec_${Date.now()}`, name: '', value: '' };
    setItemDraft(d => ({ ...d, pdpSpecifications: [...(d.pdpSpecifications ?? []), spec] }));
  };
  const updateItemSpec = (id: string, field: 'name' | 'value', val: string) => {
    setItemDraft(d => ({
      ...d,
      pdpSpecifications: d.pdpSpecifications?.map(s => s.id === id ? { ...s, [field]: val } : s),
    }));
  };
  const removeItemSpec = (id: string) => {
    setItemDraft(d => ({ ...d, pdpSpecifications: d.pdpSpecifications?.filter(s => s.id !== id) }));
  };

  /* ── Derived ── */
  const selectedRange = ranges.find(r => r.rangeId === selectedRangeId) ?? null;
  const assignedItems = sapItems.filter(i => selectedRange?.sapItemIds.includes(i.itemId));
  const availableItems = sapItems.filter(i => !selectedRange?.sapItemIds.includes(i.itemId));
  const editingItem = editingItemId ? sapItems.find(i => i.itemId === editingItemId) : null;

  /* ── Loading / Error ── */
  if (isLoading) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0066B3] border-t-transparent" />
    </div>
  );

  if (error || !isValid) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error || 'Invalid session'}</p>
        <Button onClick={() => navigate('/')} className="bg-[#0066B3] hover:bg-[#004C87] text-white">Go Home</Button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F1FA] to-[#D0E4F5]">

      {/* ── Header ── */}
      <header className="bg-[#0066B3] text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-7 w-7 text-white" />
            <div>
              <h1 className="text-xl font-bold leading-none">WorkBench PDP</h1>
              <p className="text-blue-200 text-xs mt-0.5">Range & Item Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span className="text-blue-200">{sapItems.length} SAP item{sapItems.length !== 1 ? 's' : ''}</span>
              <span className="text-blue-300">•</span>
              <span className="text-blue-200">{ranges.filter(r => r.isPublished).length} published</span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/session/${sessionId}/webview`)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-medium"
            >
              <Eye className="h-4 w-4 mr-1.5" /> Preview
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/session/${sessionId}`)}
              className="bg-[#004C87] hover:bg-[#003A6B] text-white border border-white/20 font-medium"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-4">

        {/* ── SAP items warning ── */}
        {sapItems.length === 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">No SAP items found</p>
              <p className="text-sm text-amber-700">Go to SAP Portal first to create items, then return here.</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(`/session/${sessionId}/sap`)}
              className="bg-[#00A74A] hover:bg-[#008A3D] text-white font-semibold flex-shrink-0"
            >
              Open SAP Portal
            </Button>
          </div>
        )}

        {/* ── Main layout: 3 columns ── */}
        <div className="flex gap-5" style={{ minHeight: 'calc(100vh - 160px)' }}>

          {/* ── LEFT: Ranges ── */}
          <div className="w-64 flex-shrink-0">
            <Card className="shadow-sm border-blue-100 h-full">
              <CardHeader className="bg-[#0066B3] text-white rounded-t-lg py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" /> Ranges
                  </CardTitle>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="w-7 h-7 rounded-lg bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors"
                    title="Create new range"
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                </div>
                <p className="text-blue-200 text-xs mt-0.5">{ranges.length} range{ranges.length !== 1 ? 's' : ''}</p>
              </CardHeader>
              <CardContent className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {ranges.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="h-10 w-10 mx-auto mb-2 text-blue-200" />
                    <p className="text-sm text-gray-400">No ranges yet</p>
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="mt-3 text-xs text-[#0066B3] hover:text-[#004C87] font-medium underline underline-offset-2"
                    >
                      Create first range
                    </button>
                  </div>
                ) : (
                  ranges.map(range => (
                    <div
                      key={range.rangeId}
                      onClick={() => { setSelectedRangeId(range.rangeId); setEditPanel('none'); }}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedRangeId === range.rangeId
                          ? 'bg-[#0066B3] border-[#0066B3] text-white shadow-md'
                          : 'bg-white border-blue-100 hover:border-[#0066B3]/40 hover:shadow-sm'
                      }`}
                    >
                      {/* Range image thumbnail */}
                      {(range as any).image && (
                        <div className="w-full h-16 rounded-md overflow-hidden mb-2">
                          <img src={(range as any).image} alt={range.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-sm truncate ${selectedRangeId === range.rangeId ? 'text-white' : 'text-gray-800'}`}>
                            {range.name}
                          </p>
                          <p className={`text-xs mt-0.5 ${selectedRangeId === range.rangeId ? 'text-blue-200' : 'text-gray-400'}`}>
                            {range.sapItemIds.length} item{range.sapItemIds.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {range.isPublished && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            selectedRangeId === range.rangeId ? 'bg-white/30 text-white' : 'bg-green-100 text-green-700'
                          }`}>
                            Live
                          </span>
                        )}
                      </div>
                      {/* Delete hover button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteRange(range.rangeId); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── CENTRE: Range detail + items ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {!selectedRange ? (
              <Card className="h-64 flex items-center justify-center border-blue-100 shadow-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-14 w-14 text-blue-200 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-500 mb-1">No Range Selected</h3>
                  <p className="text-gray-400 text-sm">Select a range from the left panel</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Range header card */}
                <Card className="border-blue-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {(selectedRange as any).image ? (
                          <img
                            src={(selectedRange as any).image}
                            alt={selectedRange.name}
                            className="w-14 h-14 rounded-lg object-cover border border-blue-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <LayoutGrid className="h-6 w-6 text-blue-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="font-bold text-gray-900 text-lg truncate">{selectedRange.name}</h2>
                          {selectedRange.description && (
                            <p className="text-sm text-gray-500 truncate">{selectedRange.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {assignedItems.length} item{assignedItems.length !== 1 ? 's' : ''} assigned
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={openRangeEdit}
                        className="bg-[#0066B3] hover:bg-[#004C87] text-white font-semibold flex-shrink-0 shadow-sm"
                      >
                        <Edit2 className="h-4 w-4 mr-1.5" /> Edit Range
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned items */}
                <Card className="border-blue-100 shadow-sm">
                  <CardHeader className="py-3 px-4 bg-blue-50 rounded-t-lg">
                    <CardTitle className="text-sm font-semibold text-[#0066B3] flex items-center gap-2">
                      <Package className="h-4 w-4" /> Assigned Items ({assignedItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {assignedItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No items assigned yet</p>
                        <p className="text-xs mt-1">Hover available items on the right and click <strong>+</strong> to assign</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedItems.map(item => {
                          const ovr = pdpOverrides[item.itemId];
                          const displayImg = ovr?.pdpPrimaryImage || item.primaryImage;
                          const displayName = ovr?.pdpName || item.name;
                          const hasOverride = !!ovr?.pdpDescription || !!ovr?.pdpPrice || !!ovr?.pdpPrimaryImage;
                          return (
                            <div
                              key={item.itemId}
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#0066B3]/30 hover:shadow-sm transition-all group"
                            >
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {displayImg ? (
                                  <img src={displayImg} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-300" />
                                )}
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
                                  {hasOverride && (
                                    <span className="text-[10px] bg-blue-100 text-[#0066B3] px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                                      PDP edited
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 font-mono">{item.itemNumber || item.itemId.slice(0, 18)}</p>
                                {ovr?.pdpPrice ? (
                                  <p className="text-xs text-gray-500 mt-0.5">Price: ${ovr.pdpPrice}</p>
                                ) : (
                                  <p className="text-xs text-gray-400 mt-0.5">{item.packaging.quantity} {item.packaging.unit}</p>
                                )}
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => openItemEdit(item.itemId)}
                                  className="bg-[#0066B3] hover:bg-[#004C87] text-white text-xs font-semibold h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                </Button>
                                <button
                                  onClick={() => removeItem(item.itemId)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove from range"
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* ── RIGHT: Panel (Publish + Available items OR Edit panel) ── */}
          <div className="w-80 flex-shrink-0 space-y-4">

            {/* Edit Range Panel */}
            {editPanel === 'range' && selectedRange && (
              <Card className="border-[#0066B3]/40 shadow-md">
                <CardHeader className="bg-[#0066B3] text-white rounded-t-lg py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Edit Range
                    </CardTitle>
                    <button onClick={() => setEditPanel('none')} className="hover:bg-white/20 rounded p-1">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Range Name</Label>
                    <Input
                      value={rangeDraft.name ?? ''}
                      onChange={e => setRangeDraft(d => ({ ...d, name: e.target.value }))}
                      className="mt-1 border-gray-300 focus:border-[#0066B3] focus:ring-[#0066B3]/20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Description</Label>
                    <Textarea
                      value={rangeDraft.description ?? ''}
                      onChange={e => setRangeDraft(d => ({ ...d, description: e.target.value }))}
                      rows={3}
                      className="mt-1 resize-none border-gray-300 focus:border-[#0066B3]"
                    />
                  </div>

                  {/* Range image */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Range Image</Label>
                    <input ref={rangeImageRef} type="file" accept="image/*" onChange={handleRangeImage} className="hidden" />
                    {rangeDraft.image ? (
                      <div className="mt-1 relative group">
                        <img src={rangeDraft.image} alt="Range" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => rangeImageRef.current?.click()} className="text-xs">
                            Replace
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRangeDraft(d => ({ ...d, image: undefined }))} className="text-xs">
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => rangeImageRef.current?.click()}
                        className="mt-1 w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0066B3] hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#0066B3] transition-colors"
                      >
                        <Upload className="h-5 w-5" />
                        <span className="text-xs font-medium">Upload Image</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={saveRangeDraft}
                      className="flex-1 bg-[#0066B3] hover:bg-[#004C87] text-white font-semibold shadow-sm"
                    >
                      <Save className="h-4 w-4 mr-1.5" /> Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditPanel('none')}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Item PDP Panel */}
            {editPanel === 'item' && editingItem && (
              <Card className="border-[#0066B3]/40 shadow-md">
                <CardHeader className="bg-[#0066B3] text-white rounded-t-lg py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Edit2 className="h-4 w-4" /> Edit Item PDP
                      </CardTitle>
                      <p className="text-blue-200 text-[11px] mt-0.5 truncate">{editingItem.name}</p>
                    </div>
                    <button onClick={() => setEditPanel('none')} className="hover:bg-white/20 rounded p-1">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="info">
                    <TabsList className="w-full rounded-none border-b border-gray-200 bg-gray-50 h-9">
                      <TabsTrigger value="info" className="flex-1 text-xs data-[state=active]:text-[#0066B3] data-[state=active]:border-b-2 data-[state=active]:border-[#0066B3]">
                        <Info className="h-3.5 w-3.5 mr-1" /> Info
                      </TabsTrigger>
                      <TabsTrigger value="images" className="flex-1 text-xs data-[state=active]:text-[#0066B3] data-[state=active]:border-b-2 data-[state=active]:border-[#0066B3]">
                        <ImageIcon className="h-3.5 w-3.5 mr-1" /> Images
                      </TabsTrigger>
                      <TabsTrigger value="specs" className="flex-1 text-xs data-[state=active]:text-[#0066B3] data-[state=active]:border-b-2 data-[state=active]:border-[#0066B3]">
                        <Settings className="h-3.5 w-3.5 mr-1" /> Specs
                      </TabsTrigger>
                    </TabsList>

                    {/* Info Tab */}
                    <TabsContent value="info" className="p-4 space-y-3 max-h-[60vh] overflow-y-auto m-0">
                      <div className="bg-blue-50 rounded-lg p-2.5 text-xs text-blue-700">
                        <strong>SAP Base:</strong> {editingItem.name} · {editingItem.itemNumber}
                        <br />Overrides below will show in the Web View store.
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Display Name Override</Label>
                        <Input
                          value={itemDraft.pdpName ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, pdpName: e.target.value }))}
                          placeholder={editingItem.name}
                          className="mt-1 text-sm border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={itemDraft.pdpPrice ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, pdpPrice: e.target.value }))}
                          placeholder="0.00"
                          className="mt-1 text-sm border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Stock Quantity</Label>
                        <Input
                          type="number"
                          value={itemDraft.pdpStock ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, pdpStock: e.target.value }))}
                          placeholder="e.g. 100"
                          className="mt-1 text-sm border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Marketing Description</Label>
                        <Textarea
                          value={itemDraft.pdpDescription ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, pdpDescription: e.target.value }))}
                          placeholder={editingItem.description || 'Customer-facing description...'}
                          rows={4}
                          className="mt-1 text-sm resize-none border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Technical Information</Label>
                        <Textarea
                          value={itemDraft.technicalInfo ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, technicalInfo: e.target.value }))}
                          placeholder="Technical details, certifications, compliance..."
                          rows={3}
                          className="mt-1 text-sm resize-none border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Marketing Copy</Label>
                        <Textarea
                          value={itemDraft.marketingCopy ?? ''}
                          onChange={e => setItemDraft(d => ({ ...d, marketingCopy: e.target.value }))}
                          placeholder="Selling points, key benefits..."
                          rows={3}
                          className="mt-1 text-sm resize-none border-gray-300 focus:border-[#0066B3]"
                        />
                      </div>
                    </TabsContent>

                    {/* Images Tab */}
                    <TabsContent value="images" className="p-4 space-y-4 max-h-[60vh] overflow-y-auto m-0">
                      <input ref={itemPrimaryRef} type="file" accept="image/*" onChange={handleItemPrimary} className="hidden" />
                      <input ref={itemAddlRef} type="file" accept="image/*" multiple onChange={handleItemAddl} className="hidden" />

                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Primary Image</Label>
                        {itemDraft.pdpPrimaryImage ? (
                          <div className="mt-1 relative group">
                            <img src={itemDraft.pdpPrimaryImage} alt="Primary" className="w-full h-40 object-contain bg-gray-50 rounded-lg border border-gray-200" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => itemPrimaryRef.current?.click()} className="text-xs">Replace</Button>
                              <Button size="sm" variant="destructive" onClick={() => setItemDraft(d => ({ ...d, pdpPrimaryImage: undefined }))} className="text-xs"><X className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => itemPrimaryRef.current?.click()}
                            className="mt-1 w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0066B3] hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#0066B3] transition-colors"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-xs font-medium">Upload Primary Image</span>
                          </button>
                        )}
                        {editingItem.primaryImage && !itemDraft.pdpPrimaryImage && (
                          <p className="text-[10px] text-gray-400 mt-1">Using SAP default image. Upload above to override.</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-semibold text-gray-700">Additional Images</Label>
                          <button
                            onClick={() => itemAddlRef.current?.click()}
                            className="text-xs text-[#0066B3] hover:text-[#004C87] font-semibold flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(itemDraft.pdpAdditionalImages ?? []).map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img src={img} alt={`Addl ${idx}`} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeAddlImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => itemAddlRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0066B3] flex items-center justify-center text-gray-400 hover:text-[#0066B3] transition-colors"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Specs Tab */}
                    <TabsContent value="specs" className="p-4 max-h-[60vh] overflow-y-auto m-0">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-semibold text-gray-700">Technical Specifications</Label>
                        <button
                          onClick={addItemSpec}
                          className="text-xs text-[#0066B3] hover:text-[#004C87] font-semibold flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Spec
                        </button>
                      </div>

                      {/* SAP base specs (read-only preview) */}
                      {editingItem.specifications.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-2">SAP Base Specs (read-only)</p>
                          {editingItem.specifications.map(s => (
                            <div key={s.id} className="flex gap-2 text-xs text-gray-600 py-0.5">
                              <span className="font-medium w-1/2 truncate">{s.name}</span>
                              <span className="text-gray-400 w-1/2 truncate">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-2">PDP Overrides</p>
                      {(itemDraft.pdpSpecifications ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No override specs yet</p>
                      ) : (
                        <div className="space-y-2">
                          {(itemDraft.pdpSpecifications ?? []).map(spec => (
                            <div key={spec.id} className="flex gap-2 items-center">
                              <Input
                                value={spec.name}
                                onChange={e => updateItemSpec(spec.id, 'name', e.target.value)}
                                placeholder="Name"
                                className="flex-1 h-8 text-xs border-gray-300"
                              />
                              <Input
                                value={spec.value}
                                onChange={e => updateItemSpec(spec.id, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-1 h-8 text-xs border-gray-300"
                              />
                              <button onClick={() => removeItemSpec(spec.id)} className="p-1 hover:bg-red-50 rounded">
                                <X className="h-3.5 w-3.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Save / Cancel */}
                  <div className="flex gap-2 p-4 border-t border-gray-100">
                    <Button
                      onClick={saveItemDraft}
                      className="flex-1 bg-[#0066B3] hover:bg-[#004C87] text-white font-semibold shadow-sm"
                    >
                      <Save className="h-4 w-4 mr-1.5" /> Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditPanel('none')}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Default right panel — Publish + Available Items */}
            {editPanel === 'none' && (
              <>
                {/* Publish control */}
                {selectedRange && (
                  <Card className={`border shadow-sm ${selectedRange.isPublished ? 'border-green-300' : 'border-blue-100'}`}>
                    <CardHeader className={`py-3 px-4 rounded-t-lg ${selectedRange.isPublished ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {selectedRange.isPublished
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <Globe className="h-4 w-4 text-gray-400" />
                        }
                        Publish to Web View
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className={`text-sm font-semibold ${selectedRange.isPublished ? 'text-green-700' : 'text-gray-600'}`}>
                            {selectedRange.isPublished ? 'Live' : 'Not published'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {selectedRange.isPublished ? 'Customers can see this range' : 'Hidden from customers'}
                          </p>
                        </div>
                        <Switch
                          checked={selectedRange.isPublished}
                          onCheckedChange={val => togglePublish(selectedRange.rangeId, val)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                      {selectedRange.isPublished && selectedRange.publishedAt && (
                        <p className="text-[11px] text-green-600 mt-2 font-medium">
                          Published {new Date(selectedRange.publishedAt).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Available SAP items */}
                {selectedRange && (
                  <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="py-3 px-4 bg-gray-50 rounded-t-lg">
                      <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" /> Available SAP Items
                      </CardTitle>
                      <CardDescription className="text-xs">{availableItems.length} ready to assign</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
                      {availableItems.length === 0 && sapItems.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-400 mb-3">No SAP items found</p>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/session/${sessionId}/sap`)}
                            className="bg-[#00A74A] hover:bg-[#008A3D] text-white font-semibold"
                          >
                            Open SAP Portal
                          </Button>
                        </div>
                      )}
                      {availableItems.length === 0 && sapItems.length > 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">All items already assigned</p>
                      )}
                      {availableItems.map(item => (
                        <div
                          key={item.itemId}
                          className="group flex items-center gap-2.5 p-2.5 border border-gray-200 rounded-lg hover:border-[#0066B3]/40 hover:shadow-sm transition-all bg-white"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {item.primaryImage ? (
                              <img src={item.primaryImage} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-gray-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.itemNumber || item.itemId.slice(0, 14)}</p>
                          </div>
                          <button
                            onClick={() => assignItem(item.itemId)}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-[#0066B3] hover:bg-[#004C87] flex items-center justify-center transition-all shadow-sm"
                            title="Add to range"
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* No range selected placeholder */}
                {!selectedRange && (
                  <Card className="border-blue-100 shadow-sm">
                    <CardContent className="py-10 text-center text-gray-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select a range to manage publish settings</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Range Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0066B3]">Create New Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="font-semibold">Range Name <span className="text-red-500">*</span></Label>
              <Input
                value={newRangeName}
                onChange={e => setNewRangeName(e.target.value)}
                placeholder="e.g. Power Tools Range"
                className="mt-1 border-gray-300 focus:border-[#0066B3]"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateRange()}
              />
            </div>
            <div>
              <Label className="font-semibold text-gray-600">Description <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
              <Textarea
                value={newRangeDesc}
                onChange={e => setNewRangeDesc(e.target.value)}
                placeholder="Brief description of this range..."
                rows={2}
                className="mt-1 resize-none border-gray-300 focus:border-[#0066B3]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleCreateRange}
              disabled={!newRangeName.trim()}
              className="bg-[#0066B3] hover:bg-[#004C87] text-white font-semibold shadow-sm"
            >
              Create Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkBenchPDP;
