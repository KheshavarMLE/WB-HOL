import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SessionData, 
  ProductData, 
  CartData, 
  CartItem,
  ActiveUser,
  UserInfo,
  createDefaultSession, 
  createDefaultProduct,
  createDefaultCart,
  generateUserId,
  USER_COLORS,
} from '@/types/product';
import { toast } from 'sonner';

// Use localStorage for cross-tab collaboration
const SESSION_STORAGE_PREFIX = 'demo_session_';
const USER_ID_PREFIX = 'user_id_';

// Activity timeout (30 seconds for demo purposes)
const ACTIVITY_TIMEOUT = 30000;
const HEARTBEAT_INTERVAL = 10000;

export const generateSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Message types for BroadcastChannel
interface BroadcastMessage {
  type: 'PRODUCT_CHANGE' | 'CART_CHANGE' | 'USER_JOINED' | 'USER_LEFT' | 'HEARTBEAT';
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  product?: ProductData;
  userId: string;
  username?: string;
  userColor?: string;
  timestamp: number;
}

export const useSession = (sessionId: string | null) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or get user for this session
  const initializeUser = useCallback((session: SessionData): ActiveUser => {
    if (!sessionId) throw new Error('No session ID');
    
    let userId = localStorage.getItem(`${USER_ID_PREFIX}${sessionId}`);
    let user: ActiveUser | undefined;
    
    if (userId) {
      user = session.activeUsers.find(u => u.userId === userId);
    }
    
    if (!user) {
      // Generate new user
      userId = generateUserId();
      localStorage.setItem(`${USER_ID_PREFIX}${sessionId}`, userId);
      
      // Assign username and color
      const userNumber = session.activeUsers.length + 1;
      const usedColors = session.activeUsers.map(u => u.color);
      const availableColors = USER_COLORS.filter(c => !usedColors.includes(c));
      const color = availableColors.length > 0 
        ? availableColors[0] 
        : USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      
      user = {
        userId,
        username: `User ${userNumber}`,
        color,
        lastActive: Date.now(),
        isOnline: true,
      };
      
      session.activeUsers.push(user);
    } else {
      // Update existing user
      user.lastActive = Date.now();
      user.isOnline = true;
    }
    
    return user;
  }, [sessionId]);

  // Load session from storage
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionData;
        // Check if session expired
        if (new Date(parsed.expiresAt) < new Date()) {
          setError('This demo session has expired. Please generate a new session.');
          localStorage.removeItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        } else {
          // Migrate old session format if needed
          if (!parsed.products) parsed.products = [];
          if (!parsed.cart) parsed.cart = createDefaultCart();
          if (!parsed.activeUsers) parsed.activeUsers = [];
          if (!parsed.settings) {
            parsed.settings = { theme: 'hilti', currency: 'USD', collaborationEnabled: true };
          }
          // Migrate: ensure new fields exist
          if (!parsed.sapItems) parsed.sapItems = [];
          if (!parsed.ranges) parsed.ranges = [];
          
          // Initialize current user
          const user = initializeUser(parsed);
          setCurrentUser(user);
          
          // Save updated session
          localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(parsed));
          setSession(parsed);
        }
      } catch {
        setError('Invalid session data.');
      }
    } else {
      // Create new session if it doesn't exist
      const newSession = createDefaultSession(sessionId);
      const user = initializeUser(newSession);
      setCurrentUser(user);
      localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(newSession));
      setSession(newSession);
    }
    
    setIsLoading(false);
  }, [sessionId, initializeUser]);

  // Set up BroadcastChannel for real-time sync
  useEffect(() => {
    if (!sessionId) return;

    // Create broadcast channel
    channelRef.current = new BroadcastChannel(`session_${sessionId}`);
    
    channelRef.current.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, action, product, userId, username, userColor } = event.data;
      
      // Ignore own messages
      if (userId === currentUser?.userId) return;
      
      if (type === 'PRODUCT_CHANGE' && product && action) {
        // Reload session from storage
        const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as SessionData;
          setSession(parsed);
          
          // Show notification
          if (action === 'CREATE') {
            toast.info(`${username || 'Another user'} created "${product.name || 'New Product'}"`, {
              action: {
                label: 'View',
                onClick: () => {},
              },
            });
          } else if (action === 'UPDATE') {
            toast.info(`${username || 'Another user'} updated "${product.name}"`, {
              duration: 3000,
            });
          } else if (action === 'DELETE') {
            toast.info(`${username || 'Another user'} deleted a product`, {
              duration: 3000,
            });
          }
        }
      } else if (type === 'USER_JOINED') {
        toast.success(`${username || 'A new user'} joined the session`, {
          icon: '👋',
          duration: 3000,
        });
        // Reload to get updated activeUsers
        const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        if (stored) {
          setSession(JSON.parse(stored));
        }
      } else if (type === 'HEARTBEAT') {
        // Update user activity in session
        const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        if (stored) {
          const parsed = JSON.parse(stored) as SessionData;
          const user = parsed.activeUsers.find(u => u.userId === userId);
          if (user) {
            user.lastActive = Date.now();
            user.isOnline = true;
            localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(parsed));
            setSession(parsed);
          }
        }
      }
    };

    // Broadcast that this user joined
    if (currentUser) {
      channelRef.current.postMessage({
        type: 'USER_JOINED',
        userId: currentUser.userId,
        username: currentUser.username,
        userColor: currentUser.color,
        timestamp: Date.now(),
      } as BroadcastMessage);
    }

    return () => {
      channelRef.current?.close();
    };
  }, [sessionId, currentUser]);

  // Heartbeat to track active users
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const sendHeartbeat = () => {
      // Update own activity
      const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionData;
        const user = parsed.activeUsers.find(u => u.userId === currentUser.userId);
        if (user) {
          user.lastActive = Date.now();
          user.isOnline = true;
        }
        
        // Mark inactive users
        parsed.activeUsers.forEach(u => {
          if (u.userId !== currentUser.userId && Date.now() - u.lastActive > ACTIVITY_TIMEOUT) {
            u.isOnline = false;
          }
        });
        
        localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(parsed));
        setSession(parsed);
      }
      
      // Broadcast heartbeat
      channelRef.current?.postMessage({
        type: 'HEARTBEAT',
        userId: currentUser.userId,
        timestamp: Date.now(),
      } as BroadcastMessage);
    };

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    sendHeartbeat(); // Initial heartbeat

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [sessionId, currentUser]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    if (!sessionId) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${SESSION_STORAGE_PREFIX}${sessionId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SessionData;
          setSession(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [sessionId]);

  // Helper to save and broadcast session
  const saveSession = useCallback((updatedSession: SessionData) => {
    if (!sessionId) return;
    setSession(updatedSession);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(updatedSession));
    
    // Dispatch storage event for same-tab listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${SESSION_STORAGE_PREFIX}${sessionId}`,
      newValue: JSON.stringify(updatedSession),
    }));
  }, [sessionId]);

  // Notify other users of product changes
  const notifyProductChange = useCallback((action: 'CREATE' | 'UPDATE' | 'DELETE', product: ProductData) => {
    if (!currentUser) return;
    
    channelRef.current?.postMessage({
      type: 'PRODUCT_CHANGE',
      action,
      product,
      userId: currentUser.userId,
      username: currentUser.username,
      userColor: currentUser.color,
      timestamp: Date.now(),
    } as BroadcastMessage);
  }, [currentUser]);

  // Get user info for attribution
  const getUserInfo = useCallback((): UserInfo | undefined => {
    if (!currentUser) return undefined;
    return {
      userId: currentUser.userId,
      username: currentUser.username,
      color: currentUser.color,
      timestamp: Date.now(),
    };
  }, [currentUser]);

  // Product CRUD operations with user attribution
  const createProduct = useCallback((productData?: Partial<ProductData>): ProductData | null => {
    if (!session) return null;
    
    const userInfo = getUserInfo();
    const newProduct: ProductData = {
      ...createDefaultProduct(),
      ...productData,
      createdBy: userInfo,
      lastModifiedBy: userInfo,
    };
    
    const updatedSession: SessionData = {
      ...session,
      products: [...session.products, newProduct],
    };
    
    saveSession(updatedSession);
    notifyProductChange('CREATE', newProduct);
    return newProduct;
  }, [session, saveSession, getUserInfo, notifyProductChange]);

  const updateProduct = useCallback((productId: string, updates: Partial<ProductData>) => {
    if (!session) return;
    
    const userInfo = getUserInfo();
    const updatedProducts = session.products.map((product) =>
      product.productId === productId
        ? { 
            ...product, 
            ...updates, 
            lastModified: new Date().toISOString(),
            lastModifiedBy: userInfo,
          }
        : product
    );
    
    const updatedProduct = updatedProducts.find(p => p.productId === productId);
    
    const updatedSession: SessionData = {
      ...session,
      products: updatedProducts,
    };
    
    // Update cart if product details changed
    if (updates.name || updates.price || updates.primaryImage) {
      const cartItems = session.cart.items.map((item) => {
        if (item.productId === productId) {
          const product = updatedProducts.find(p => p.productId === productId);
          if (product) {
            return {
              ...item,
              productName: product.name,
              price: product.price,
              thumbnail: product.primaryImage,
            };
          }
        }
        return item;
      });
      
      updatedSession.cart = {
        ...session.cart,
        items: cartItems,
        subtotal: calculateSubtotal(cartItems),
        lastUpdated: new Date().toISOString(),
      };
    }
    
    saveSession(updatedSession);
    if (updatedProduct) {
      notifyProductChange('UPDATE', updatedProduct);
    }
  }, [session, saveSession, getUserInfo, notifyProductChange]);

  const deleteProduct = useCallback((productId: string) => {
    if (!session) return;
    
    const deletedProduct = session.products.find(p => p.productId === productId);
    const updatedProducts = session.products.filter((p) => p.productId !== productId);
    const updatedCartItems = session.cart.items.filter((item) => item.productId !== productId);
    
    const updatedSession: SessionData = {
      ...session,
      products: updatedProducts,
      cart: {
        items: updatedCartItems,
        subtotal: calculateSubtotal(updatedCartItems),
        itemCount: updatedCartItems.reduce((sum, item) => sum + item.quantity, 0),
        lastUpdated: new Date().toISOString(),
      },
    };
    
    saveSession(updatedSession);
    if (deletedProduct) {
      notifyProductChange('DELETE', deletedProduct);
    }
  }, [session, saveSession, notifyProductChange]);

  const duplicateProduct = useCallback((productId: string): ProductData | null => {
    if (!session) return null;
    
    const originalProduct = session.products.find((p) => p.productId === productId);
    if (!originalProduct) return null;
    
    const userInfo = getUserInfo();
    const duplicatedProduct: ProductData = {
      ...originalProduct,
      productId: `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: `${originalProduct.name} (Copy)`,
      sku: `${originalProduct.sku}-COPY`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: userInfo,
      lastModifiedBy: userInfo,
    };
    
    const updatedSession: SessionData = {
      ...session,
      products: [...session.products, duplicatedProduct],
    };
    
    saveSession(updatedSession);
    notifyProductChange('CREATE', duplicatedProduct);
    return duplicatedProduct;
  }, [session, saveSession, getUserInfo, notifyProductChange]);

  const getProductById = useCallback((productId: string): ProductData | undefined => {
    return session?.products.find((p) => p.productId === productId);
  }, [session]);

  // Cart operations
  const calculateSubtotal = (items: CartItem[]): number => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  const addToCart = useCallback((product: ProductData, quantity: number = 1) => {
    if (!session) return;
    
    const existingItemIndex = session.cart.items.findIndex(
      (item) => item.productId === product.productId
    );
    
    let updatedItems: CartItem[];
    
    if (existingItemIndex > -1) {
      // Increment existing item quantity
      updatedItems = session.cart.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.productId,
        productName: product.name,
        price: product.price,
        quantity,
        thumbnail: product.primaryImage,
      };
      updatedItems = [...session.cart.items, newItem];
    }
    
    const updatedCart: CartData = {
      items: updatedItems,
      subtotal: calculateSubtotal(updatedItems),
      itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdated: new Date().toISOString(),
    };
    
    const updatedSession: SessionData = {
      ...session,
      cart: updatedCart,
    };
    
    saveSession(updatedSession);
  }, [session, saveSession]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (!session) return;
    
    let updatedItems: CartItem[];
    
    if (quantity <= 0) {
      updatedItems = session.cart.items.filter((item) => item.productId !== productId);
    } else {
      updatedItems = session.cart.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
    }
    
    const updatedCart: CartData = {
      items: updatedItems,
      subtotal: calculateSubtotal(updatedItems),
      itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdated: new Date().toISOString(),
    };
    
    const updatedSession: SessionData = {
      ...session,
      cart: updatedCart,
    };
    
    saveSession(updatedSession);
  }, [session, saveSession]);

  const removeFromCart = useCallback((productId: string) => {
    updateCartQuantity(productId, 0);
  }, [updateCartQuantity]);

  const clearCart = useCallback(() => {
    if (!session) return;
    
    const updatedSession: SessionData = {
      ...session,
      cart: createDefaultCart(),
    };
    
    saveSession(updatedSession);
  }, [session, saveSession]);

  // Reset session data
  const resetSession = useCallback(() => {
    if (!sessionId) return;
    
    const newSession = createDefaultSession(sessionId);
    if (currentUser) {
      newSession.activeUsers.push(currentUser);
    }
    saveSession(newSession);
  }, [sessionId, currentUser, saveSession]);

  // Create a new session
  const createSession = useCallback(() => {
    const newSessionId = generateSessionId();
    const newSession = createDefaultSession(newSessionId);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${newSessionId}`, JSON.stringify(newSession));
    return newSessionId;
  }, []);

  // Get online users count
  const getOnlineUsers = useCallback((): ActiveUser[] => {
    if (!session) return [];
    return session.activeUsers.filter(u => u.isOnline);
  }, [session]);

  // Filter products by creator
  const getProductsByCreator = useCallback((creatorId: string | null): ProductData[] => {
    if (!session) return [];
    if (!creatorId) return session.products;
    return session.products.filter(p => p.createdBy?.userId === creatorId);
  }, [session]);

  // Get product counts by user
  const getProductCountsByUser = useCallback((): Map<string, number> => {
    const counts = new Map<string, number>();
    if (!session) return counts;
    
    session.products.forEach(p => {
      const userId = p.createdBy?.userId || 'unknown';
      counts.set(userId, (counts.get(userId) || 0) + 1);
    });
    
    return counts;
  }, [session]);

  // Generic session update — used by SAP Portal and WorkBench
  const updateSession = useCallback((updatedSession: SessionData) => {
    if (!sessionId) return;
    setSession(updatedSession);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(updatedSession));
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${SESSION_STORAGE_PREFIX}${sessionId}`,
      newValue: JSON.stringify(updatedSession),
    }));
  }, [sessionId]);

  return {
    session,
    products: session?.products ?? [],
    cart: session?.cart ?? createDefaultCart(),
    activeUsers: session?.activeUsers ?? [],
    currentUser,
    isLoading,
    error,
    isValid: !!session && !error,
    
    // Product operations
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    getProductById,
    getProductsByCreator,
    getProductCountsByUser,
    
    // Cart operations
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    
    // User/collaboration operations
    getOnlineUsers,
    
    // Session operations
    updateSession,
    resetSession,
    createSession,
  };
};
