import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Package, FileText, ArrowRight, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { SAPItem, PackagingInfo, BOMComponent } from '@/types/sap';
import { generateSAPItemId, createDefaultSAPItem } from '@/types/sap';

const SAPPortal = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, updateSession } = useSession(sessionId || '');

  const [sapItems, setSapItems] = useState<SAPItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SAPItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session?.sapItems) {
      setSapItems(session.sapItems);
    }
  }, [session]);

  const handleCreateNew = () => {
    const newItem = createDefaultSAPItem();
    setCurrentItem(newItem);
    setIsEditing(true);
  };

  const handleSaveItem = () => {
    if (!currentItem) return;

    const updated = [...sapItems];
    const existingIndex = updated.findIndex(i => i.itemId === currentItem.itemId);

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...currentItem,
        lastModified: new Date().toISOString(),
      };
      toast.success('SAP item updated');
    } else {
      updated.push(currentItem);
      toast.success('SAP item created');
    }

    setSapItems(updated);
    updateSession({ ...session!, sapItems: updated });
    setIsEditing(false);
    setCurrentItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = sapItems.filter(i => i.itemId !== itemId);
    setSapItems(updated);
    updateSession({ ...session!, sapItems: updated });
    toast.success('SAP item deleted');
  };

  const handleExportToWorkbench = () => {
    toast.success(`${sapItems.length} items ready for WorkBench PDP`);
    navigate(`/session/${sessionId}/workbench`);
  };

  const addBOMComponent = () => {
    if (!currentItem) return;
    setCurrentItem({
      ...currentItem,
      billOfMaterials: [
        ...currentItem.billOfMaterials,
        {
          id: `bom_${Date.now()}`,
          component: '',
          quantity: 1,
          unit: 'pcs',
        },
      ],
    });
  };

  const removeBOMComponent = (id: string) => {
    if (!currentItem) return;
    setCurrentItem({
      ...currentItem,
      billOfMaterials: currentItem.billOfMaterials.filter(b => b.id !== id),
    });
  };

  const addSpecification = () => {
    if (!currentItem) return;
    setCurrentItem({
      ...currentItem,
      specifications: [
        ...currentItem.specifications,
        {
          id: `spec_${Date.now()}`,
          name: '',
          value: '',
        },
      ],
    });
  };

  const removeSpecification = (id: string) => {
    if (!currentItem) return;
    setCurrentItem({
      ...currentItem,
      specifications: currentItem.specifications.filter(s => s.id !== id),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-[#00A74A] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">SAP Portal</h1>
                <p className="text-green-100 text-sm">Item & Material Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">Session: {sessionId}</span>
              <Button
                variant="secondary"
                onClick={() => navigate(`/session/${sessionId}`)}
              >
                Back to Selector
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Item Library */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00A74A]" />
                  SAP Item Library
                </CardTitle>
                <CardDescription>{sapItems.length} items</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  onClick={handleCreateNew}
                  className="w-full bg-[#00A74A] hover:bg-[#008A3D]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Item
                </Button>

                <div className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
                  {sapItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="p-3 border rounded-lg hover:border-[#00A74A] cursor-pointer transition-colors"
                      onClick={() => {
                        setCurrentItem(item);
                        setIsEditing(true);
                      }}
                    >
                      <div className="font-semibold text-sm">{item.name || 'Unnamed Item'}</div>
                      <div className="text-xs text-gray-500 font-mono">{item.itemNumber || item.itemId}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.packaging.quantity} {item.packaging.unit}
                      </div>
                    </div>
                  ))}
                </div>

                {sapItems.length > 0 && (
                  <Button
                    onClick={handleExportToWorkbench}
                    className="w-full mt-4 bg-[#0066B3] hover:bg-[#004C87]"
                  >
                    Export to WorkBench
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Item Editor */}
          <div className="lg:col-span-2">
            {isEditing && currentItem ? (
              <Card>
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#00A74A]" />
                    {sapItems.find(i => i.itemId === currentItem.itemId) ? 'Edit' : 'Create'} SAP Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Item Number</Label>
                        <Input
                          value={currentItem.itemNumber}
                          onChange={(e) => setCurrentItem({ ...currentItem, itemNumber: e.target.value })}
                          placeholder="HIL-ITEM-001"
                        />
                      </div>
                      <div>
                        <Label>SAP ID</Label>
                        <Input
                          value={currentItem.itemId}
                          disabled
                          className="font-mono text-xs bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Item Name *</Label>
                      <Input
                        value={currentItem.name}
                        onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                        placeholder="Cordless Impact Drill"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                        placeholder="Professional cordless impact drill..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Packaging Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Packaging Information</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Unit</Label>
                        <Select
                          value={currentItem.packaging.unit}
                          onValueChange={(value: any) => 
                            setCurrentItem({
                              ...currentItem,
                              packaging: { ...currentItem.packaging, unit: value }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="pallet">Pallet</SelectItem>
                            <SelectItem value="carton">Carton</SelectItem>
                            <SelectItem value="each">Each</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={currentItem.packaging.quantity}
                          onChange={(e) => 
                            setCurrentItem({
                              ...currentItem,
                              packaging: { ...currentItem.packaging, quantity: parseInt(e.target.value) || 1 }
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Dimensions</Label>
                        <Input
                          value={currentItem.packaging.dimensions || ''}
                          onChange={(e) => 
                            setCurrentItem({
                              ...currentItem,
                              packaging: { ...currentItem.packaging, dimensions: e.target.value }
                            })
                          }
                          placeholder="L x W x H"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bill of Materials */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg border-b pb-2 flex-1">Bill of Materials</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addBOMComponent}
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Component
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {currentItem.billOfMaterials.map((bom) => (
                        <div key={bom.id} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Input
                              value={bom.component}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  billOfMaterials: currentItem.billOfMaterials.map(b =>
                                    b.id === bom.id ? { ...b, component: e.target.value } : b
                                  )
                                })
                              }
                              placeholder="Component name"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={bom.quantity}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  billOfMaterials: currentItem.billOfMaterials.map(b =>
                                    b.id === bom.id ? { ...b, quantity: parseInt(e.target.value) || 1 } : b
                                  )
                                })
                              }
                              placeholder="Qty"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={bom.unit}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  billOfMaterials: currentItem.billOfMaterials.map(b =>
                                    b.id === bom.id ? { ...b, unit: e.target.value } : b
                                  )
                                })
                              }
                              placeholder="Unit"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={bom.material || ''}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  billOfMaterials: currentItem.billOfMaterials.map(b =>
                                    b.id === bom.id ? { ...b, material: e.target.value } : b
                                  )
                                })
                              }
                              placeholder="Material"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeBOMComponent(bom.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg border-b pb-2 flex-1">Technical Specifications</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSpecification}
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Spec
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {currentItem.specifications.map((spec) => (
                        <div key={spec.id} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Input
                              value={spec.name}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  specifications: currentItem.specifications.map(s =>
                                    s.id === spec.id ? { ...s, name: e.target.value } : s
                                  )
                                })
                              }
                              placeholder="Specification name"
                            />
                          </div>
                          <div className="col-span-6">
                            <Input
                              value={spec.value}
                              onChange={(e) => 
                                setCurrentItem({
                                  ...currentItem,
                                  specifications: currentItem.specifications.map(s =>
                                    s.id === spec.id ? { ...s, value: e.target.value } : s
                                  )
                                })
                              }
                              placeholder="Value"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSpecification(spec.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleSaveItem}
                      className="bg-[#00A74A] hover:bg-[#008A3D]"
                      disabled={!currentItem.name}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save SAP Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setCurrentItem(null);
                      }}
                    >
                      Cancel
                    </Button>
                    {sapItems.find(i => i.itemId === currentItem.itemId) && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDeleteItem(currentItem.itemId);
                          setIsEditing(false);
                          setCurrentItem(null);
                        }}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Item Selected</h3>
                  <p className="text-gray-400">Create a new item or select an existing one to edit</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SAPPortal;
