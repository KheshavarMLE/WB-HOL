import { useState, useMemo } from 'react';
import { ProductData, PRODUCT_CATEGORIES, ProductCategory, ActiveUser } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Grid,
  Search,
  Edit,
  Copy,
  Trash2,
  Plus,
  Package,
  ImageIcon,
  Eye,
} from 'lucide-react';

interface ProductLibraryProps {
  products: ProductData[];
  activeUsers?: ActiveUser[];
  currentUserId?: string;
  onEdit: (productId: string) => void;
  onDuplicate: (productId: string) => void;
  onDelete: (productId: string) => void;
  onCreateNew: () => void;
  theme?: 'hilti' | 'workbench';
}

const ProductLibrary = ({
  products,
  activeUsers = [],
  currentUserId,
  onEdit,
  onDuplicate,
  onDelete,
  onCreateNew,
  theme = 'hilti',
}: ProductLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isWorkbench = theme === 'workbench';

  // Get unique creators from products
  const creators = useMemo(() => {
    const creatorMap = new Map<string, { userId: string; username: string; color: string; count: number }>();
    
    products.forEach((product) => {
      const creatorId = product.createdBy?.userId || 'unknown';
      const existing = creatorMap.get(creatorId);
      
      if (existing) {
        existing.count++;
      } else {
        creatorMap.set(creatorId, {
          userId: creatorId,
          username: product.createdBy?.username || 'Unknown',
          color: product.createdBy?.color || '#888888',
          count: 1,
        });
      }
    });
    
    return Array.from(creatorMap.values());
  }, [products]);

  // Get counts for current user vs others
  const userProductCount = useMemo(() => {
    if (!currentUserId) return { mine: 0, others: products.length };
    const mine = products.filter(p => p.createdBy?.userId === currentUserId).length;
    return { mine, others: products.length - mine };
  }, [products, currentUserId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;
      const matchesCreator =
        creatorFilter === 'all' || 
        (creatorFilter === 'mine' && product.createdBy?.userId === currentUserId) ||
        product.createdBy?.userId === creatorFilter;
      return matchesSearch && matchesCategory && matchesCreator;
    });
  }, [products, searchQuery, categoryFilter, creatorFilter, currentUserId]);

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // Check if current user can edit/delete a product
  const canModify = (product: ProductData): boolean => {
    // For demo, allow full collaboration (anyone can edit)
    return true;
  };

  const formatTimeAgo = (timestamp: string | number): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isWorkbench ? 'bg-[hsl(var(--workbench))]/10' : 'bg-primary/10'
          }`}>
            <Grid className={`w-5 h-5 ${isWorkbench ? 'text-[hsl(var(--workbench))]' : 'text-primary'}`} />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              Product Library
            </h2>
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''} total
              {currentUserId && products.length > 0 && (
                <span className="ml-1">
                  ({userProductCount.mine} by you, {userProductCount.others} by others)
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={onCreateNew} className={isWorkbench ? 'workbench-button' : 'hilti-button'}>
          <Plus className="w-4 h-4" />
          Create New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Creator Filter */}
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users ({products.length})</SelectItem>
            {currentUserId && (
              <SelectItem value="mine">Your Products ({userProductCount.mine})</SelectItem>
            )}
            {creators.map((creator) => (
              <SelectItem key={creator.userId} value={creator.userId}>
                <span className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full inline-block" 
                    style={{ backgroundColor: creator.color }}
                  />
                  {creator.userId === currentUserId ? 'You' : creator.username} ({creator.count})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            {products.length === 0 ? 'No Products Yet' : 'No Matching Products'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {products.length === 0
              ? 'Create your first product to get started.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {products.length === 0 && (
            <Button onClick={onCreateNew} className={isWorkbench ? 'workbench-button' : 'hilti-button'}>
              <Plus className="w-4 h-4" />
              Create First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.productId}
              className={`bg-card rounded-xl border border-border/50 overflow-hidden shadow-card transition-all duration-300 group ${
                isWorkbench 
                  ? 'hover:border-[hsl(var(--workbench))]/50 hover:shadow-[var(--shadow-hover-blue)]' 
                  : 'hover:shadow-hover hover:border-primary/30'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
                {product.category && (
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${
                    isWorkbench 
                      ? 'bg-[hsl(var(--workbench))] text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {product.category}
                  </span>
                )}
                
                {/* User Avatar Badge */}
                {product.createdBy && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-md cursor-default"
                        style={{ backgroundColor: product.createdBy.color }}
                      >
                        {product.createdBy.userId === currentUserId 
                          ? '★' 
                          : product.createdBy.username.charAt(0).toUpperCase()
                        }
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Created by {product.createdBy.userId === currentUserId ? 'you' : product.createdBy.username}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground truncate">
                  {product.name || 'Untitled Product'}
                </h3>
                <div className="flex items-center justify-between mt-1 mb-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    {product.sku || 'No SKU'}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ${product.price || '0.00'}
                  </span>
                </div>
                
                {/* Attribution */}
                {product.createdBy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: product.createdBy.color }}
                    />
                    <span>
                      {product.createdBy.userId === currentUserId ? 'You' : product.createdBy.username}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(product.createdBy.timestamp)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {canModify(product) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(product.productId)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEdit(product.productId)}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicate(product.productId)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {canModify(product) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirmId(product.productId)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
              The product will also be removed from any shopping carts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductLibrary;
