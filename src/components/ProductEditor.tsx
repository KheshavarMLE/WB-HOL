import { useState, useRef, useCallback } from 'react';
import { ProductData, Specification, PRODUCT_CATEGORIES, ProductCategory } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductEditorProps {
  product: ProductData;
  onUpdate: (productId: string, updates: Partial<ProductData>) => void;
  onBack: () => void;
  isNew?: boolean;
  theme?: 'hilti' | 'workbench';
}

const ProductEditor = ({
  product,
  onUpdate,
  onBack,
  isNew = false,
  theme = 'hilti',
}: ProductEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const primaryImageRef = useRef<HTMLInputElement>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  const isWorkbench = theme === 'workbench';

  const handleInputChange = useCallback((field: string, value: string) => {
    onUpdate(product.productId, { [field]: value });
  }, [product.productId, onUpdate]);

  const handleCategoryChange = useCallback((value: string) => {
    onUpdate(product.productId, { category: value as ProductCategory });
  }, [product.productId, onUpdate]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast.success('Changes saved successfully!');
    }, 300);
  }, []);

  const handleImageUpload = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'primary' | 'additional'
  ) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (type === 'primary') {
          onUpdate(product.productId, { primaryImage: base64 });
        } else {
          onUpdate(product.productId, {
            additionalImages: [...product.additionalImages, base64],
          });
        }
        toast.success('Image uploaded!');
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  }, [product.productId, product.additionalImages, onUpdate]);

  const removeAdditionalImage = useCallback((index: number) => {
    const newImages = [...product.additionalImages];
    newImages.splice(index, 1);
    onUpdate(product.productId, { additionalImages: newImages });
  }, [product.productId, product.additionalImages, onUpdate]);

  const addSpecification = useCallback(() => {
    const newSpec: Specification = {
      id: crypto.randomUUID(),
      name: '',
      value: '',
    };
    onUpdate(product.productId, {
      specifications: [...product.specifications, newSpec],
    });
  }, [product.productId, product.specifications, onUpdate]);

  const updateSpecification = useCallback((id: string, field: 'name' | 'value', value: string) => {
    const updated = product.specifications.map((spec) =>
      spec.id === id ? { ...spec, [field]: value } : spec
    );
    onUpdate(product.productId, { specifications: updated });
  }, [product.productId, product.specifications, onUpdate]);

  const removeSpecification = useCallback((id: string) => {
    const filtered = product.specifications.filter((spec) => spec.id !== id);
    onUpdate(product.productId, { specifications: filtered });
  }, [product.productId, product.specifications, onUpdate]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button & Save */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className={isWorkbench ? 'border-[hsl(var(--workbench))] text-[hsl(var(--workbench))] hover:bg-[hsl(var(--workbench))]/10' : ''}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Product Information */}
      <section className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
        <h2 className="text-lg font-display font-semibold text-foreground mb-6">
          {isNew ? 'New Product' : 'Edit Product'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={product.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={product.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="ABC123"
              className="mt-1.5 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={product.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              value={product.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="99.99"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              value={product.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
              placeholder="100"
              className="mt-1.5"
            />
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
        <h2 className="text-lg font-display font-semibold text-foreground mb-6">
          Description
        </h2>
        <Textarea
          value={product.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter a detailed product description..."
          rows={5}
        />
      </section>

      {/* Product Images */}
      <section className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
        <h2 className="text-lg font-display font-semibold text-foreground mb-6">
          Product Images
        </h2>

        {/* Primary Image */}
        <div className="mb-6">
          <Label className="mb-3 block">Primary Image</Label>
          <input
            ref={primaryImageRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'primary')}
            className="hidden"
          />
          {product.primaryImage ? (
            <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-border group">
              <img
                src={product.primaryImage}
                alt="Primary product"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => primaryImageRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onUpdate(product.productId, { primaryImage: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => primaryImageRef.current?.click()}
              className={`w-48 h-48 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground ${
                isWorkbench 
                  ? 'border-border hover:border-[hsl(var(--workbench))]/50' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">Upload Image</span>
            </button>
          )}
        </div>

        {/* Additional Images */}
        <div>
          <Label className="mb-3 block">Additional Images</Label>
          <input
            ref={additionalImagesRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e, 'additional')}
            className="hidden"
          />
          <div className="flex flex-wrap gap-3">
            {product.additionalImages.map((img, index) => (
              <div
                key={index}
                className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group"
              >
                <img src={img} alt={`Additional ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeAdditionalImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => additionalImagesRef.current?.click()}
              className={`w-24 h-24 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground ${
                isWorkbench 
                  ? 'border-border hover:border-[hsl(var(--workbench))]/50' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-foreground">
            Specifications
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addSpecification}
            className={isWorkbench ? 'border-[hsl(var(--workbench))] text-[hsl(var(--workbench))] hover:bg-[hsl(var(--workbench))]/10' : ''}
          >
            <Plus className="w-4 h-4" />
            Add Specification
          </Button>
        </div>

        {product.specifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No specifications added yet. Click "Add Specification" to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {product.specifications.map((spec) => (
              <div key={spec.id} className="flex items-center gap-3">
                <Input
                  value={spec.name}
                  onChange={(e) => updateSpecification(spec.id, 'name', e.target.value)}
                  placeholder="Name (e.g., Weight)"
                  className="flex-1"
                />
                <Input
                  value={spec.value}
                  onChange={(e) => updateSpecification(spec.id, 'value', e.target.value)}
                  placeholder="Value (e.g., 2.5 kg)"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpecification(spec.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductEditor;
