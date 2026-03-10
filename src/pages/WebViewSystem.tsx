import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { ProductData } from '@/types/product';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart as CartIcon,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  AlertCircle,
  ImageIcon,
  ArrowLeft,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductCatalog from '@/components/ProductCatalog';
import ShoppingCart from '@/components/ShoppingCart';

type ViewMode = 'catalog' | 'product';

const WebViewSystem = () => {
  const { sessionId, productId: routeProductId } = useParams<{ sessionId: string; productId?: string }>();
  const navigate = useNavigate();
  const {
    products,
    cart,
    isLoading,
    error,
    isValid,
    getProductById,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useSession(sessionId || null);

  const [viewMode, setViewMode] = useState<ViewMode>(routeProductId ? 'product' : 'catalog');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(routeProductId || null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const selectedProduct = selectedProductId ? getProductById(selectedProductId) : null;

  const allImages = selectedProduct
    ? [selectedProduct.primaryImage, ...selectedProduct.additionalImages].filter(Boolean)
    : [];

  const stockNum = selectedProduct ? parseInt(selectedProduct.stock) || 0 : 0;
  const isInStock = stockNum > 0;

  const handleViewProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setViewMode('product');
    setQuantity(1);
    setCurrentImageIndex(0);
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setViewMode('catalog');
    setSelectedProductId(null);
  }, []);

  const handleAddToCart = useCallback((product: ProductData, qty: number = 1) => {
    addToCart(product, qty);
  }, [addToCart]);

  const handleAddCurrentToCart = useCallback(() => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity);
      toast.success(`${selectedProduct.name} added to cart!`);
    }
  }, [selectedProduct, quantity, addToCart]);

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold mb-2">Session Error</h1>
          <p className="text-muted-foreground mb-6">{error || 'Invalid session'}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Store Header - Hilti Style */}
      <header className="border-b border-border/50 hilti-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-display font-bold text-xl text-header-foreground">
              HILTI
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-header-foreground/80">
              <button
                onClick={handleBackToCatalog}
                className="hover:text-header-foreground transition-colors"
              >
                Products
              </button>
              <span className="hover:text-header-foreground cursor-pointer transition-colors">Categories</span>
              <span className="hover:text-header-foreground cursor-pointer transition-colors">About</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10">
              <Heart className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-header-foreground hover:bg-white/10"
              onClick={() => setIsCartOpen(true)}
            >
              <CartIcon className="w-5 h-5" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                  {cart.itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Switch to WorkBench Banner */}
      <div className="bg-secondary/50 border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Demo Mode</span>
            <span className="hidden sm:inline"> — Data syncs in real-time from WorkBench</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(`/session/${sessionId}/workbench`)} className="shrink-0">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Switch to WorkBench</span>
            <span className="sm:hidden">WorkBench</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {viewMode === 'catalog' ? (
          <ProductCatalog
            products={products}
            onViewProduct={handleViewProduct}
            onAddToCart={handleAddToCart}
          />
        ) : selectedProduct ? (
          <div className="animate-fade-in">
            {/* Back Button */}
            <button
              onClick={handleBackToCatalog}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <button onClick={handleBackToCatalog} className="hover:text-foreground">Home</button>
              <span>/</span>
              {selectedProduct.category && (
                <>
                  <span className="hover:text-foreground cursor-pointer">{selectedProduct.category}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-foreground">{selectedProduct.name || 'Product'}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden border border-border/50">
                  {allImages.length > 0 ? (
                    <>
                      <img
                        src={allImages[currentImageIndex]}
                        alt={selectedProduct.name || 'Product'}
                        className="w-full h-full object-contain"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-lg"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-lg"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-20 h-20 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                          idx === currentImageIndex
                            ? 'border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* SKU & Category */}
                {(selectedProduct.sku || selectedProduct.category) && (
                  <div className="flex items-center gap-3 text-sm">
                    {selectedProduct.sku && (
                      <span className="font-mono text-muted-foreground">
                        SKU: {selectedProduct.sku}
                      </span>
                    )}
                    {selectedProduct.category && (
                      <span className="px-2.5 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        {selectedProduct.category}
                      </span>
                    )}
                  </div>
                )}

                {/* Name */}
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                  {selectedProduct.name || 'Untitled Product'}
                </h1>

                {/* Reviews */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < 4 ? 'text-warning fill-warning' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(24 reviews)</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">
                    ${selectedProduct.price || '0.00'}
                  </span>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isInStock ? 'bg-success' : 'bg-destructive'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isInStock ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {isInStock ? `In Stock (${stockNum} available)` : 'Out of Stock'}
                  </span>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
                  <div className="flex items-center border border-border rounded-lg self-start">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-secondary transition-colors"
                      disabled={!isInStock}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stockNum || 99, quantity + 1))}
                      className="p-3 hover:bg-secondary transition-colors"
                      disabled={!isInStock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    className="hilti-button flex-1"
                    size="lg"
                    disabled={!isInStock}
                    onClick={handleAddCurrentToCart}
                  >
                    <CartIcon className="w-5 h-5" />
                    Add to Cart
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={!isInStock}
                >
                  Buy Now
                </Button>

                {/* Share */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                    Add to Wishlist
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="grid md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-border">
              {/* Description */}
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                  Description
                </h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedProduct.description || 'No description available.'}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                  Specifications
                </h2>
                {selectedProduct.specifications.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <tbody>
                        {selectedProduct.specifications.map((spec, idx) => (
                          <tr
                            key={spec.id}
                            className={idx % 2 === 0 ? 'bg-muted/50' : 'bg-background'}
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              {spec.name || 'Unnamed'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {spec.value || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specifications available.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Product Not Found
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              This product may have been removed or doesn't exist.
            </p>
            <Button className="hilti-button" onClick={handleBackToCatalog}>
              <ArrowLeft className="w-4 h-4" />
              Back to Catalog
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© 2026 HILTI Demo Store. This is a demo storefront.</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-foreground cursor-pointer">Privacy</span>
              <span className="hover:text-foreground cursor-pointer">Terms</span>
              <span className="hover:text-foreground cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Sidebar */}
      <ShoppingCart
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default WebViewSystem;
