import { useMemo, useState } from 'react';
import { ProductData, PRODUCT_CATEGORIES, ProductCategory } from '@/types/product';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Eye,
  Package,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductCatalogProps {
  products: ProductData[];
  onViewProduct: (productId: string) => void;
  onAddToCart: (product: ProductData) => void;
}

type SortOption = 'name-asc' | 'price-low' | 'price-high';

const ProductCatalog = ({
  products,
  onViewProduct,
  onAddToCart,
}: ProductCatalogProps) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;
      // Only show products with at least a name
      return matchesCategory && product.name;
    });

    // Sort
    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        break;
    }

    return filtered;
  }, [products, categoryFilter, sortOption]);

  const handleQuickAdd = (e: React.MouseEvent, product: ProductData) => {
    e.stopPropagation();
    onAddToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(categories) as ProductCategory[];
  }, [products]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {PRODUCT_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
          </span>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            No Products Available
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {products.length === 0
              ? 'Products will appear here once they are created in the PDP System.'
              : 'No products match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <div
              key={product.productId}
              className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group cursor-pointer"
              onClick={() => onViewProduct(product.productId)}
            >
              {/* Image */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {product.primaryImage ? (
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                )}
                {product.category && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                )}
                
                {/* Quick Add Button - appears on hover */}
                <button
                  onClick={(e) => handleQuickAdd(e, product)}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-primary/90"
                  title="Quick Add to Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">
                    ${product.price || '0.00'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProduct(product.productId);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
