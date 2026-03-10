import { CartData, CartItem } from '@/types/product';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ShoppingCartProps {
  cart: CartData;
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClearCart: () => void;
}

const ShoppingCart = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onClearCart,
}: ShoppingCartProps) => {
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  const handleCheckout = () => {
    setShowCheckoutSuccess(true);
    setTimeout(() => {
      onClearCart();
      setShowCheckoutSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Shopping Cart
            {cart.itemCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {cart.itemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {showCheckoutSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Order Placed!
            </h3>
            <p className="text-muted-foreground max-w-xs">
              Thank you for your order. This is a demo checkout — no payment was processed.
            </p>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add products to get started.
            </p>
            <Button onClick={onClose} className="hilti-button">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemove}
                />
              ))}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg">
                <span className="font-medium text-muted-foreground">Subtotal</span>
                <span className="font-bold text-foreground">
                  ${cart.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full hilti-button"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItemRow = ({ item, onUpdateQuantity, onRemove }: CartItemRowProps) => {
  const itemTotal = (parseFloat(item.price) || 0) * item.quantity;

  return (
    <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate pr-2">
          {item.productName || 'Untitled Product'}
        </h4>
        <p className="text-sm text-muted-foreground">
          ${item.price || '0.00'} each
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="p-1.5 hover:bg-secondary transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="p-1.5 hover:bg-secondary transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              ${itemTotal.toFixed(2)}
            </span>
            <button
              onClick={() => onRemove(item.productId)}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
