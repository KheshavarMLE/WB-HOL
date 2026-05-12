import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Database, Package, Plus, Trash2, Save, ArrowRight,
  ChevronLeft, FileText, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  SAPItem, BOMComponent, Specification,
  createDefaultSAPItem, generateSAPItemId,
  SessionData,
} from '@/types/product';

/* ─────────────────────────────────────────────────────────────────────────── */

const SAPPortal = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, isValid, updateSession } = useSession(sessionId || null);

  const [sapItems, setSapItems] = useState<SAPItem[]>([]);
  const [editing, setEditing] = useState<SAPItem | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  /* sync state from session */
  useEffect(() => {
    if (session?.sapItems) setSapItems(session.sapItems);
  }, [session?.sapItems]);

  /* ── helpers ── */
  const persistItems = useCallback((items: SAPItem[]) => {
    if (!session) return;
    setSapItems(items);
    updateSession({ ...session, sapItems: items } as SessionData);
  }, [session, updateSession]);

  const startNew = () => {
    const fresh = createDefaultSAPItem();
    fresh.itemId = generateSAPItemId();
    setEditing(fresh);
    setIsDirty(false);
  };

  const selectItem = (item: SAPItem) => {
    setEditing({ ...item });
    setIsDirty(false);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error('Item Name is required');
      return;
    }

    const updated = [...sapItems];
    const idx = updated.findIndex(i => i.itemId === editing.itemId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      updated[idx] = { ...editing, lastModified: now };
      toast.success('SAP item updated');
    } else {
      updated.push({ ...editing, lastModified: now });
      toast.success('SAP item saved ✓');
    }

    persistItems(updated);
    setEditing(null);
    setIsDirty(false);
  };

  const handleDelete = (itemId: string) => {
    if (!confirm('Delete this SAP item?')) return;
    const updated = sapItems.filter(i => i.itemId !== itemId);
    persistItems(updated);
    if (editing?.itemId === itemId) setEditing(null);
    toast.success('Item deleted');
  };

  const handleExport = () => {
    if (sapItems.length === 0) {
      toast.error('Create at least one SAP item first');
      return;
    }
    toast.success(`${sapItems.length} item${sapItems.length !== 1 ? 's' : ''} ready in WorkBench`);
    navigate(`/session/${sessionId}/workbench`);
  };

  /* ── BOM helpers ── */
  const addBOM = () => {
    if (!editing) return;
    const bom: BOMComponent = {
      id: `bom_${Date.now()}`,
      component: '', quantity: 1, unit: 'pcs',
    };
    setEditing({ ...editing, billOfMaterials: [...editing.billOfMaterials, bom] });
    setIsDirty(true);
  };

  const updateBOM = (id: string, field: keyof BOMComponent, val: string | number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      billOfMaterials: editing.billOfMaterials.map(b =>
        b.id === id ? { ...b, [field]: val } : b
      ),
    });
    setIsDirty(true);
  };

  const removeBOM = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, billOfMaterials: editing.billOfMaterials.filter(b => b.id !== id) });
    setIsDirty(true);
  };

  /* ── Spec helpers ── */
  const addSpec = () => {
    if (!editing) return;
    const spec: Specification = { id: `spec_${Date.now()}`, name: '', value: '' };
    setEditing({ ...editing, specifications: [...editing.specifications, spec] });
    setIsDirty(true);
  };

  const updateSpec = (id: string, field: 'name' | 'value', val: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      specifications: editing.specifications.map(s =>
        s.id === id ? { ...s, [field]: val } : s
      ),
    });
    setIsDirty(true);
  };

  const removeSpec = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, specifications: editing.specifications.filter(s => s.id !== id) });
    setIsDirty(true);
  };

  /* ── Loading / Error states ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#00A74A] border-t-transparent" />
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Invalid session'}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">

      {/* ── Header ── */}
      <header className="bg-[#00A74A] text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold leading-none">SAP Portal</h1>
              <p className="text-green-100 text-xs mt-0.5">Item & Material Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-green-100 text-sm hidden sm:block">
              Session: <span className="font-mono font-semibold text-white">{sessionId}</span>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/session/${sessionId}`)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Item Library ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-green-50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-[#00A74A]" />
                SAP Item Library
              </CardTitle>
              <CardDescription>
                {sapItems.length} item{sapItems.length !== 1 ? 's' : ''} saved
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                className="w-full bg-[#00A74A] hover:bg-[#008A3D]"
                onClick={startNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Item
              </Button>

              {/* Item list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {sapItems.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">
                    No items yet. Create your first SAP item.
                  </p>
                )}
                {sapItems.map(item => (
                  <div
                    key={item.itemId}
                    onClick={() => selectItem(item)}
                    className={`group p-3 border rounded-lg cursor-pointer transition-all select-none ${
                      editing?.itemId === item.itemId
                        ? 'border-[#00A74A] bg-green-50 shadow-sm'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{item.name || 'Untitled Item'}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.itemNumber || item.itemId.slice(0, 20)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.packaging.quantity} {item.packaging.unit}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(item.itemId); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export button */}
              {sapItems.length > 0 && (
                <Button
                  onClick={handleExport}
                  className="w-full bg-[#0066B3] hover:bg-[#004C87]"
                >
                  Export to WorkBench
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Editor ── */}
        <div className="lg:col-span-2">
          {!editing ? (
            <Card className="h-full flex items-center justify-center min-h-[400px] shadow-sm">
              <CardContent className="text-center py-16">
                <Database className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-1">No Item Selected</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Create a new item or select an existing one to edit
                </p>
                <Button className="bg-[#00A74A] hover:bg-[#008A3D]" onClick={startNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-[#00A74A]" />
                  {sapItems.some(i => i.itemId === editing.itemId) ? 'Edit SAP Item' : 'New SAP Item'}
                  {isDirty && <span className="text-xs text-amber-600 ml-2">(unsaved changes)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">

                {/* ── Basic Information ── */}
                <section>
                  <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Item Number</Label>
                      <Input
                        value={editing.itemNumber}
                        onChange={e => { setEditing({ ...editing, itemNumber: e.target.value }); setIsDirty(true); }}
                        placeholder="e.g. HIL-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>SAP ID</Label>
                      <Input
                        value={editing.itemId}
                        disabled
                        className="mt-1 font-mono text-xs bg-gray-50 text-gray-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>
                        Item Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={editing.name}
                        onChange={e => { setEditing({ ...editing, name: e.target.value }); setIsDirty(true); }}
                        placeholder="e.g. Cordless Impact Driver"
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editing.description}
                        onChange={e => { setEditing({ ...editing, description: e.target.value }); setIsDirty(true); }}
                        placeholder="Brief product description..."
                        rows={3}
                        className="mt-1 resize-none"
                      />
                    </div>
                  </div>
                </section>

                {/* ── Packaging ── */}
                <section>
                  <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Packaging Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={editing.packaging.unit}
                        onValueChange={val => {
                          setEditing({ ...editing, packaging: { ...editing.packaging, unit: val } });
                          setIsDirty(true);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['pcs', 'box', 'pallet', 'carton', 'each'].map(u => (
                            <SelectItem key={u} value={u}>
                              {u.charAt(0).toUpperCase() + u.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editing.packaging.quantity}
                        onChange={e => {
                          setEditing({
                            ...editing,
                            packaging: { ...editing.packaging, quantity: parseInt(e.target.value) || 1 },
                          });
                          setIsDirty(true);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Dimensions</Label>
                      <Input
                        value={editing.packaging.dimensions || ''}
                        onChange={e => {
                          setEditing({
                            ...editing,
                            packaging: { ...editing.packaging, dimensions: e.target.value },
                          });
                          setIsDirty(true);
                        }}
                        placeholder="L × W × H mm"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </section>

                {/* ── Bill of Materials ── */}
                <section>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <h3 className="font-semibold text-gray-700">Bill of Materials</h3>
                    <Button size="sm" variant="outline" onClick={addBOM}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Component
                    </Button>
                  </div>
                  {editing.billOfMaterials.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No components added</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
                        <span className="col-span-5">Component</span>
                        <span className="col-span-2">Qty</span>
                        <span className="col-span-4">Unit</span>
                        <span className="col-span-1" />
                      </div>
                      {editing.billOfMaterials.map(bom => (
                        <div key={bom.id} className="grid grid-cols-12 gap-2 items-center">
                          <Input
                            className="col-span-5 h-8 text-sm"
                            value={bom.component}
                            onChange={e => updateBOM(bom.id, 'component', e.target.value)}
                            placeholder="Component name"
                          />
                          <Input
                            className="col-span-2 h-8 text-sm"
                            type="number"
                            min={1}
                            value={bom.quantity}
                            onChange={e => updateBOM(bom.id, 'quantity', parseInt(e.target.value) || 1)}
                          />
                          <Input
                            className="col-span-4 h-8 text-sm"
                            value={bom.unit}
                            onChange={e => updateBOM(bom.id, 'unit', e.target.value)}
                            placeholder="pcs"
                          />
                          <button
                            onClick={() => removeBOM(bom.id)}
                            className="col-span-1 p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Technical Specifications ── */}
                <section>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <h3 className="font-semibold text-gray-700">Technical Specifications</h3>
                    <Button size="sm" variant="outline" onClick={addSpec}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Spec
                    </Button>
                  </div>
                  {editing.specifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No specifications added</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
                        <span className="col-span-5">Name</span>
                        <span className="col-span-6">Value</span>
                        <span className="col-span-1" />
                      </div>
                      {editing.specifications.map(spec => (
                        <div key={spec.id} className="grid grid-cols-12 gap-2 items-center">
                          <Input
                            className="col-span-5 h-8 text-sm"
                            value={spec.name}
                            onChange={e => updateSpec(spec.id, 'name', e.target.value)}
                            placeholder="e.g. Voltage"
                          />
                          <Input
                            className="col-span-6 h-8 text-sm"
                            value={spec.value}
                            onChange={e => updateSpec(spec.id, 'value', e.target.value)}
                            placeholder="e.g. 18V"
                          />
                          <button
                            onClick={() => removeSpec(spec.id)}
                            className="col-span-1 p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Actions ── */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={!editing.name.trim()}
                    className="bg-[#00A74A] hover:bg-[#008A3D] text-white font-semibold shadow-sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save SAP Item
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setEditing(null); setIsDirty(false); }}
                  >
                    Cancel
                  </Button>
                  {sapItems.some(i => i.itemId === editing.itemId) && (
                    <Button
                      variant="destructive"
                      className="ml-auto"
                      onClick={() => handleDelete(editing.itemId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SAPPortal;
