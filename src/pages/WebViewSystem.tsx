import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart as CartIcon,
  Minus, Plus, X, ChevronLeft, ChevronRight,
  Package, Search, ArrowLeft, Star, Layers,
  CheckCircle2, ShoppingBag, RefreshCw, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SAPItem, Range, SessionData } from '@/types/product';

/* ─────────────────────────────────────────────────────────────────────────── */

type View = 'catalog' | 'range' | 'item';

interface CartState {
  items: { itemId: string; name: string; itemNumber: string; quantity: number }[];
  isOpen: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────── */

const WebViewSystem = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, isValid } = useSession(sessionId || null);

  const [view, setView] = useState<View>('catalog');
  const [activeRangeId, setActiveRangeId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartState>({ items: [], isOpen: false });

  /* ── Data ── */
  const allRanges: Range[] = session?.ranges ?? [];
  const allSapItems: SAPItem[] = session?.sapItems ?? [];
  const pdpOverrides: Record<string, any> = (session as any)?.pdpOverrides ?? {};

  /** Merge SAP base item with any PDP overrides */
  const resolveItem = (item: SAPItem) => {
    const ovr = pdpOverrides[item.itemId];
    if (!ovr) return item;
    return {
      ...item,
      name: ovr.pdpName || item.name,
      description: ovr.pdpDescription || item.description,
      primaryImage: ovr.pdpPrimaryImage || item.primaryImage,
      additionalImages: ovr.pdpAdditionalImages?.length ? ovr.pdpAdditionalImages : [],
      specifications: ovr.pdpSpecifications?.length ? ovr.pdpSpecifications : item.specifications,
      pdpPrice: ovr.pdpPrice,
      pdpStock: ovr.pdpStock,
      technicalInfo: ovr.technicalInfo,
      marketingCopy: ovr.marketingCopy,
    };
  };
  const publishedRanges = allRanges.filter(r => r.isPublished);

  const activeRange = allRanges.find(r => r.rangeId === activeRangeId) ?? null;
  const activeItem = activeItemId ? resolveItem(allSapItems.find(i => i.itemId === activeItemId)!) ?? null : null;

  const rangeItems = (range: Range) =>
    allSapItems.filter(i => range.sapItemIds.includes(i.itemId)).map(resolveItem);

  /* search across published items */
  const searchResults: { item: SAPItem; range: Range }[] = search.trim().length > 1
    ? publishedRanges.flatMap(range =>
        rangeItems(range)
          .filter(i =>
            (i.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (i.itemNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (i.description ?? '').toLowerCase().includes(search.toLowerCase())
          )
          .map(item => ({ item, range }))
      )
    : [];

  /* ── Cart helpers ── */
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const addToCart = useCallback((item: SAPItem) => {
    setCart(prev => {
      const exists = prev.items.find(i => i.itemId === item.itemId);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { itemId: item.itemId, name: item.name, itemNumber: item.itemNumber, quantity: 1 }],
      };
    });
    toast.success(`"${item.name}" added to cart`);
  }, []);

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => ({
      ...prev,
      items: prev.items
        .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0),
    }));
  };

  /* ── Navigation ── */
  const goRange = (rangeId: string) => {
    setActiveRangeId(rangeId);
    setView('range');
    setSearch('');
  };

  const goItem = (itemId: string, rangeId?: string) => {
    setActiveItemId(itemId);
    if (rangeId) setActiveRangeId(rangeId);
    setView('item');
  };

  const goCatalog = () => {
    setView('catalog');
    setActiveRangeId(null);
    setActiveItemId(null);
  };

  /* ── Loading / Error ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#D2051E] border-t-transparent" />
      </div>
    );
  }
  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Invalid session'}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Sticky Header ── */}
      <header className="bg-[#2D2D2D] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo / back */}
          <button
            onClick={() => navigate(`/session/${sessionId}`)}
            className="flex items-center gap-2 mr-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-[#D2051E] rounded flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">Hilti Store</span>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 h-9"
            />
          </div>

          {/* Cart */}
          <button
            onClick={() => setCart(p => ({ ...p, isOpen: !p.isOpen }))}
            className="relative p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D2051E] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Breadcrumb */}
        {(view === 'range' || view === 'item') && (
          <div className="max-w-7xl mx-auto px-4 pb-2 flex items-center gap-1.5 text-xs text-white/60">
            <button onClick={goCatalog} className="hover:text-white transition-colors">All Ranges</button>
            {activeRange && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => { setView('range'); setActiveItemId(null); }}
                  className="hover:text-white transition-colors"
                >
                  {activeRange.name}
                </button>
              </>
            )}
            {view === 'item' && activeItem && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/90">{activeItem.name}</span>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">

        {/* ── Search results overlay ── */}
        {search.trim().length > 1 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              Search results for &ldquo;<span className="text-[#D2051E]">{search}</span>&rdquo;
              <span className="text-gray-400 text-sm font-normal ml-2">({searchResults.length} found)</span>
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-gray-400">No items found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map(({ item, range }) => (
                  <ItemCard
                    key={item.itemId}
                    item={item}
                    range={range}
                    onView={() => goItem(item.itemId, range.rangeId)}
                    onCart={() => addToCart(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Catalog view ── */}
        {!search.trim() && view === 'catalog' && (
          <>
            {publishedRanges.length === 0 ? (
              <div className="text-center py-20">
                <Layers className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">No published content yet</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Create ranges in WorkBench PDP, assign items, then publish them here.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/session/${sessionId}/workbench`)}
                >
                  Go to WorkBench PDP
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Ranges</h1>
                  <p className="text-gray-500 text-sm">
                    {publishedRanges.length} published range{publishedRanges.length !== 1 ? 's' : ''} •{' '}
                    {publishedRanges.reduce((s, r) => s + r.sapItemIds.length, 0)} items
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedRanges.map(range => {
                    const items = rangeItems(range);
                    return (
                      <button
                        key={range.rangeId}
                        onClick={() => goRange(range.rangeId)}
                        className="group text-left border border-gray-200 rounded-xl overflow-hidden hover:border-[#D2051E] hover:shadow-lg transition-all"
                      >
                        {/* Range thumbnail grid */}
                        <div className="bg-gray-50 p-4 h-40 flex items-center justify-center border-b border-gray-100">
                          {items.length === 0 ? (
                            <Package className="h-12 w-12 text-gray-300" />
                          ) : (
                            <div className="grid grid-cols-2 gap-2 w-full h-full">
                              {items.slice(0, 4).map(item => (
                                <div key={item.itemId} className="bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                                  {item.primaryImage ? (
                                    <img src={item.primaryImage} alt={item.name} className="w-full h-full object-contain rounded-lg" />
                                  ) : (
                                    <Package className="h-6 w-6 text-gray-300" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-[#D2051E] transition-colors">
                                {range.name}
                              </h3>
                              {range.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{range.description}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                {items.length} item{items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                              Live
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Range view ── */}
        {!search.trim() && view === 'range' && activeRange && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activeRange.name}</h1>
                {activeRange.description && (
                  <p className="text-gray-500 mt-1">{activeRange.description}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  {rangeItems(activeRange).length} item{rangeItems(activeRange).length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={goCatalog}>
                <ArrowLeft className="h-4 w-4 mr-1" /> All Ranges
              </Button>
            </div>

            {rangeItems(activeRange).length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No items in this range yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rangeItems(activeRange).map(item => (
                  <ItemCard
                    key={item.itemId}
                    item={item}
                    range={activeRange}
                    onView={() => goItem(item.itemId)}
                    onCart={() => addToCart(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Item detail view ── */}
        {!search.trim() && view === 'item' && activeItem && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => { setView('range'); setActiveItemId(null); }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {activeRange?.name ?? 'Range'}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center">
                {activeItem.primaryImage ? (
                  <img src={activeItem.primaryImage} alt={activeItem.name} className="w-full h-full object-contain rounded-xl p-4" />
                ) : (
                  <Package className="h-24 w-24 text-gray-200" />
                )}
              </div>

              {/* Details */}
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-1">
                    {activeItem.itemNumber || activeItem.itemId}
                  </p>
                  <h1 className="text-2xl font-bold text-gray-900">{activeItem.name}</h1>
                  {activeItem.description && (
                    <p className="text-gray-500 mt-2 leading-relaxed">{activeItem.description}</p>
                  )}
                </div>

                {/* Price & Stock */}
                {((activeItem as any).pdpPrice) && (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">${(activeItem as any).pdpPrice}</span>
                    {(activeItem as any).pdpStock && (
                      <span className="text-sm text-green-600 font-medium">{(activeItem as any).pdpStock} in stock</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 py-3 border-y border-gray-100">
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-gray-500">Unit: </span>
                    <span className="font-medium">{activeItem.packaging.unit}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-gray-500">Qty: </span>
                    <span className="font-medium">{activeItem.packaging.quantity}</span>
                  </div>
                  {activeItem.packaging.dimensions && (
                    <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                      <span className="text-gray-500">Dim: </span>
                      <span className="font-medium">{activeItem.packaging.dimensions}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-[#D2051E] hover:bg-[#A50418] h-12 text-base"
                  onClick={() => addToCart(activeItem)}
                >
                  <CartIcon className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>

                {/* Specs */}
                {activeItem.specifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Specifications</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {activeItem.specifications.map((spec, idx) => (
                        <div
                          key={spec.id}
                          className={`flex text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        >
                          <span className="w-1/2 px-3 py-2 font-medium text-gray-600 border-r border-gray-200">
                            {spec.name}
                          </span>
                          <span className="w-1/2 px-3 py-2 text-gray-800">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOM */}
                {activeItem.billOfMaterials.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Bill of Materials</h3>
                    <div className="space-y-1">
                      {activeItem.billOfMaterials.map(bom => (
                        <div key={bom.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                          <span className="text-gray-700">{bom.component}</span>
                          <span className="text-gray-500">{bom.quantity} {bom.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Info (from PDP override) */}
                {(activeItem as any).technicalInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Technical Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-200">
                      {(activeItem as any).technicalInfo}
                    </div>
                  </div>
                )}

                {/* Marketing Copy (from PDP override) */}
                {(activeItem as any).marketingCopy && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Key Benefits</h3>
                    <div className="bg-[#E8F4FF] rounded-lg p-4 text-sm text-[#0066B3] leading-relaxed whitespace-pre-wrap border border-[#0066B3]/20">
                      {(activeItem as any).marketingCopy}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Cart Sidebar ── */}
      <>
        {cart.isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setCart(p => ({ ...p, isOpen: false }))}
          />
        )}
        <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${cart.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Cart Header */}
          <div className="bg-[#2D2D2D] text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Cart
              {cartCount > 0 && (
                <span className="bg-[#D2051E] text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
              )}
            </h2>
            <button onClick={() => setCart(p => ({ ...p, isOpen: false }))}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              cart.items.map(item => (
                <div key={item.itemId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.itemNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.itemId, -1)}
                      className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.itemId, 1)}
                      className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.items.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{cartCount}</span>
              </div>
              <Button
                className="w-full bg-[#D2051E] hover:bg-[#A50418] h-11"
                onClick={() => {
                  setCart({ items: [], isOpen: false });
                  toast.success('Order placed successfully! 🎉');
                }}
              >
                Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCart(p => ({ ...p, isOpen: false }))}
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>
      </>
    </div>
  );
};

/* ── Item Card Component ── */
interface ItemCardProps {
  item: SAPItem;
  range: Range;
  onView: () => void;
  onCart: () => void;
}

const ItemCard = ({ item, range, onView, onCart }: ItemCardProps) => (
  <div className="group border border-gray-200 rounded-xl overflow-hidden hover:border-[#D2051E] hover:shadow-md transition-all flex flex-col">
    <button onClick={onView} className="block p-4 bg-gray-50 h-40 flex items-center justify-center border-b border-gray-100">
      {item.primaryImage ? (
        <img src={item.primaryImage} alt={item.name} className="w-full h-full object-contain" />
      ) : (
        <Package className="h-12 w-12 text-gray-200 group-hover:text-gray-300 transition-colors" />
      )}
    </button>
    <div className="p-3 flex flex-col flex-1">
      <p className="text-[10px] text-gray-400 font-mono mb-0.5">{item.itemNumber || item.itemId.slice(0, 15)}</p>
      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1 group-hover:text-[#D2051E] transition-colors">
        {item.name}
      </h3>
      <p className="text-xs text-gray-400 mt-1">
        {item.packaging.quantity} {item.packaging.unit}
      </p>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs"
          onClick={onView}
        >
          View
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 text-xs bg-[#D2051E] hover:bg-[#A50418]"
          onClick={onCart}
        >
          <CartIcon className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  </div>
);

export default WebViewSystem;
