import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { ProductData, createDefaultProduct } from '@/types/product';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Eye,
  RefreshCw,
  AlertCircle,
  Grid,
  Plus,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductLibrary from '@/components/ProductLibrary';
import ProductEditor from '@/components/ProductEditor';
import ActiveUsersIndicator from '@/components/ActiveUsersIndicator';

type ViewMode = 'library' | 'editor';

const WorkBenchPDP = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    products,
    activeUsers,
    currentUser,
    isLoading,
    error,
    isValid,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    getProductById,
    getOnlineUsers,
  } = useSession(sessionId || null);

  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  const currentProduct = editingProductId ? getProductById(editingProductId) : null;
  const onlineUsers = getOnlineUsers();

  const handleCreateNew = useCallback(() => {
    const newProduct = createProduct();
    if (newProduct) {
      setEditingProductId(newProduct.productId);
      setIsNewProduct(true);
      setViewMode('editor');
      toast.success('New product created!');
    }
  }, [createProduct]);

  const handleEdit = useCallback((productId: string) => {
    setEditingProductId(productId);
    setIsNewProduct(false);
    setViewMode('editor');
  }, []);

  const handleDuplicate = useCallback((productId: string) => {
    const duplicated = duplicateProduct(productId);
    if (duplicated) {
      toast.success('Product duplicated!');
    }
  }, [duplicateProduct]);

  const handleDelete = useCallback((productId: string) => {
    deleteProduct(productId);
    toast.success('Product deleted!');
  }, [deleteProduct]);

  const handleBackToLibrary = useCallback(() => {
    setViewMode('library');
    setEditingProductId(null);
    setIsNewProduct(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[hsl(var(--workbench))] animate-spin" />
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
      {/* Header - WorkBench Blue */}
      <header className="border-b border-border/50 workbench-header sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/session/${sessionId}`)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-white">WorkBench PDP</h1>
                <p className="text-xs text-white/70">Session: {sessionId}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Users */}
            <ActiveUsersIndicator 
              users={activeUsers} 
              currentUserId={currentUser?.userId} 
              variant="light"
            />

            {/* Product Count */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <Grid className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            {viewMode === 'library' && (
              <Button
                onClick={handleCreateNew}
                className="workbench-button"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Product
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/session/${sessionId}/webview`)}
            >
              <Eye className="w-4 h-4" />
              Preview Store
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {viewMode === 'library' ? (
          <ProductLibrary
            products={products}
            activeUsers={activeUsers}
            currentUserId={currentUser?.userId}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onCreateNew={handleCreateNew}
            theme="workbench"
          />
        ) : currentProduct ? (
          <ProductEditor
            product={currentProduct}
            onUpdate={updateProduct}
            onBack={handleBackToLibrary}
            isNew={isNewProduct}
            theme="workbench"
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Product not found.</p>
            <Button onClick={handleBackToLibrary} className="mt-4">
              Back to Library
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkBenchPDP;
