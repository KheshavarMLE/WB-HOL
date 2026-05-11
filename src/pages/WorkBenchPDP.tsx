import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertCircle, ArrowLeft, ChevronLeft, Eye, FileText,
  Globe, Package, Plus, Trash2, Wrench, X, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Range, SAPItem, SessionData,
  createDefaultRange,
} from '@/types/product';

/* ─────────────────────────────────────────────────────────────────────────── */

const WorkBenchPDP = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, isValid, updateSession } = useSession(sessionId || null);

  const [ranges, setRanges] = useState<Range[]>([]);
  const [sapItems, setSapItems] = useState<SAPItem[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);

  /* dialogs */
  const [createOpen, setCreateOpen] = useState(false);
  const [newRangeName, setNewRangeName] = useState('');
  const [newRangeDesc, setNewRangeDesc] = useState('');

  /* sync from session */
  useEffect(() => {
    if (session) {
      setRanges(session.ranges ?? []);
      setSapItems(session.sapItems ?? []);
    }
  }, [session?.ranges, session?.sapItems]);

  /* ── persist ── */
  const persistRanges = useCallback((updated: Range[]) => {
    if (!session) return;
    setRanges(updated);
    updateSession({ ...session, ranges: updated } as SessionData);
  }, [session, updateSession]);

  /* ── Range CRUD ── */
  const handleCreateRange = () => {
    if (!newRangeName.trim()) return;
    const r = createDefaultRange(newRangeName.trim());
    r.description = newRangeDesc.trim();
    persistRanges([...ranges, r]);
    setSelectedRangeId(r.rangeId);
    setNewRangeName('');
    setNewRangeDesc('');
    setCreateOpen(false);
    toast.success(`Range "${r.name}" created`);
  };

  const handleDeleteRange = (rangeId: string) => {
    const r = ranges.find(r => r.rangeId === rangeId);
    if (!confirm(`Delete range "${r?.name}"?`)) return;
    persistRanges(ranges.filter(r => r.rangeId !== rangeId));
    if (selectedRangeId === rangeId) setSelectedRangeId(null);
    toast.success('Range deleted');
  };

  /* ── Item assignment ── */
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

  /* ── Publish toggle ── */
  const togglePublish = (rangeId: string, val: boolean) => {
    persistRanges(ranges.map(r =>
      r.rangeId === rangeId
        ? { ...r, isPublished: val, publishedAt: val ? new Date().toISOString() : undefined, lastModified: new Date().toISOString() }
        : r
    ));
    toast.success(val ? '✓ Range is now live in Web View' : 'Range unpublished');
  };

  /* ── Derived ── */
  const selectedRange = ranges.find(r => r.rangeId === selectedRangeId) ?? null;
  const assignedItems = sapItems.filter(i => selectedRange?.sapItemIds.includes(i.itemId));
  const availableItems = sapItems.filter(i => !selectedRange?.sapItemIds.includes(i.itemId));

  /* ── States ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0066B3] border-t-transparent" />
      </div>
    );
  }
  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Invalid session'}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">

      {/* ── Header ── */}
      <header className="bg-[#0066B3] text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold leading-none">WorkBench PDP</h1>
              <p className="text-blue-100 text-xs mt-0.5">Range & Item Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-sm text-blue-100">
              <span>{sapItems.length} SAP item{sapItems.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{ranges.filter(r => r.isPublished).length} published</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(`/session/${sessionId}/webview`)}
            >
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/session/${sessionId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">

        {/* ── SAP items warning ── */}
        {sapItems.length === 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">No SAP items found</p>
                <p className="text-sm text-amber-600">
                  Go to SAP Portal first, create and save your items, then come back to organise them into ranges.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#00A74A] hover:bg-[#008A3D] flex-shrink-0"
                onClick={() => navigate(`/session/${sessionId}/sap`)}
              >
                SAP Portal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── 3-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT: Range List ── */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardHeader className="bg-blue-50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#0066B3]" />
                    Ranges
                  </CardTitle>
                  <Button
                    size="sm"
                    className="h-7 bg-[#0066B3] hover:bg-[#004C87] px-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardDescription>{ranges.length} range{ranges.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
                {ranges.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No ranges yet</p>
                    <p className="text-xs">Click + to create one</p>
                  </div>
                )}
                {ranges.map(range => (
                  <div
                    key={range.rangeId}
                    onClick={() => setSelectedRangeId(range.rangeId)}
                    className={`group relative p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedRangeId === range.rangeId
                        ? 'bg-blue-100 border-[#0066B3] shadow-sm'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="pr-6">
                      <p className="font-medium text-sm truncate">{range.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {range.sapItemIds.length} item{range.sapItemIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {range.isPublished ? (
                      <span className="absolute top-2 right-7 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                        Live
                      </span>
                    ) : null}
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteRange(range.rangeId); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── CENTRE: Assigned items ── */}
          <div className="lg:col-span-5">
            {!selectedRange ? (
              <Card className="h-full min-h-[300px] flex items-center justify-center shadow-sm">
                <CardContent className="text-center py-12">
                  <Package className="h-14 w-14 text-gray-200 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-500 mb-1">No Range Selected</h3>
                  <p className="text-gray-400 text-sm">Select a range on the left to manage items</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardHeader className="bg-blue-50 pb-3">
                  <CardTitle className="text-base">{selectedRange.name}</CardTitle>
                  {selectedRange.description && (
                    <CardDescription>{selectedRange.description}</CardDescription>
                  )}
                  <CardDescription>
                    {assignedItems.length} item{assignedItems.length !== 1 ? 's' : ''} assigned
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
                  {assignedItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No items assigned</p>
                      <p className="text-xs">Click <strong>+</strong> on available items →</p>
                    </div>
                  ) : (
                    assignedItems.map(item => (
                      <div
                        key={item.itemId}
                        className="group flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-[#0066B3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{item.itemNumber || item.itemId.slice(0, 18)}</p>
                          <p className="text-xs text-gray-400">
                            {item.packaging.quantity} {item.packaging.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.itemId)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 rounded transition-opacity"
                        >
                          <X className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Available items + Publish ── */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Publish control */}
            {selectedRange && (
              <Card className={`shadow-sm ${selectedRange.isPublished ? 'border-green-400' : ''}`}>
                <CardHeader className={`pb-3 ${selectedRange.isPublished ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <CardTitle className="text-base flex items-center gap-2">
                    {selectedRange.isPublished
                      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                      : <Globe className="h-5 w-5 text-gray-400" />
                    }
                    Publish to Web View
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {selectedRange.isPublished ? 'Live' : 'Not published'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedRange.isPublished
                          ? 'Customers can see this range'
                          : 'Range is hidden from customers'}
                      </p>
                    </div>
                    <Switch
                      checked={selectedRange.isPublished}
                      onCheckedChange={val => togglePublish(selectedRange.rangeId, val)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  {selectedRange.isPublished && selectedRange.publishedAt && (
                    <p className="text-xs text-green-600 mt-3">
                      Published {new Date(selectedRange.publishedAt).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Available SAP Items */}
            {selectedRange && (
              <Card className="shadow-sm flex-1">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    Available SAP Items
                  </CardTitle>
                  <CardDescription>
                    {availableItems.length} item{availableItems.length !== 1 ? 's' : ''} available
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2 max-h-[40vh] overflow-y-auto">
                  {availableItems.length === 0 && sapItems.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-sm">No SAP items found</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => navigate(`/session/${sessionId}/sap`)}
                      >
                        Go to SAP Portal
                      </Button>
                    </div>
                  )}
                  {availableItems.length === 0 && sapItems.length > 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">
                      All items already assigned
                    </p>
                  )}
                  {availableItems.map(item => (
                    <div
                      key={item.itemId}
                      className="group flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/40 transition-all"
                    >
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{item.itemNumber || item.itemId.slice(0, 15)}</p>
                      </div>
                      <button
                        onClick={() => assignItem(item.itemId)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-[#0066B3] hover:bg-[#004C87] rounded transition-all"
                        title="Add to range"
                      >
                        <Plus className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!selectedRange && sapItems.length > 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-6 text-center text-gray-400">
                  <p className="text-sm">Select a range to assign items</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Range Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Range Name <span className="text-red-500">*</span></Label>
              <Input
                value={newRangeName}
                onChange={e => setNewRangeName(e.target.value)}
                placeholder="e.g. Power Tools Range"
                className="mt-1"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateRange()}
              />
            </div>
            <div>
              <Label>Description <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Textarea
                value={newRangeDesc}
                onChange={e => setNewRangeDesc(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateRange}
              disabled={!newRangeName.trim()}
              className="bg-[#0066B3] hover:bg-[#004C87]"
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
