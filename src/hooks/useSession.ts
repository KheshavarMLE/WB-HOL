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

// ─── Storage keys ─────────────────────────────────────────────────────────────
const SESSION_STORAGE_PREFIX = 'demo_session_';
const USER_ID_PREFIX = 'user_id_';

// How we share sessions across devices:
// 1. Same browser / same device  → localStorage (instant, no-latency)
// 2. Different browser / device  → sessionData is base64-encoded into the URL
//    as a ?snap=<base64> query param the FIRST time the link is visited.
//    After that, the receiver's localStorage takes over.
//
// The LandingPage encodes the current session state into the shareable URL so
// ANY recipient can bootstrap from it — no server needed.

const ACTIVITY_TIMEOUT = 30_000;
const HEARTBEAT_INTERVAL = 10_000;

export const generateSessionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
};

interface BroadcastMessage {
  type: 'SESSION_UPDATED' | 'PRODUCT_CHANGE' | 'CART_CHANGE' | 'USER_JOINED' | 'USER_LEFT' | 'HEARTBEAT';
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  product?: ProductData;
  userId: string;
  username?: string;
  userColor?: string;
  timestamp: number;
}

// ─── Snapshot helpers (URL-based sharing) ────────────────────────────────────

/**
 * Encode session data into a compact base64 string safe for URLs.
 * We strip activeUsers and cart to keep it small.
 */
export const encodeSessionSnapshot = (session: SessionData): string => {
  const slim = {
    sessionId: session.sessionId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    settings: session.settings,
    sapItems: session.sapItems ?? [],
    ranges: session.ranges ?? [],
    pdpOverrides: (session as any).pdpOverrides ?? {},
    // products kept for backward compat
    products: session.products ?? [],
  };
  return btoa(encodeURIComponent(JSON.stringify(slim)));
};

/**
 * Decode a snapshot string back into partial session data.
 * Returns null if decoding fails.
 */
export const decodeSessionSnapshot = (snap: string): Partial<SessionData> | null => {
  try {
    const json = decodeURIComponent(atob(snap));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSession = (sessionId: string | null) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // ── Initialize/get user ──────────────────────────────────────────────────
  const initializeUser = useCallback((sess: SessionData): ActiveUser => {
    if (!sessionId) throw new Error('No session ID');

    let userId = localStorage.getItem(`${USER_ID_PREFIX}${sessionId}`);
    let user = userId ? sess.activeUsers.find(u => u.userId === userId) : undefined;

    if (!user) {
      userId = generateUserId();
      localStorage.setItem(`${USER_ID_PREFIX}${sessionId}`, userId);

      const userNumber = sess.activeUsers.length + 1;
      const usedColors = sess.activeUsers.map(u => u.color);
      const availableColors = USER_COLORS.filter(c => !usedColors.includes(c));
      const color = availableColors[0] ?? USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

      user = {
        userId,
        username: `User ${userNumber}`,
        color,
        lastActive: Date.now(),
        isOnline: true,
      };
      sess.activeUsers.push(user);
    } else {
      user.lastActive = Date.now();
      user.isOnline = true;
    }

    return user;
  }, [sessionId]);

  // ── Save to localStorage ─────────────────────────────────────────────────
  const saveSession = useCallback((updated: SessionData) => {
    if (!sessionId) return;
    setSession(updated);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${SESSION_STORAGE_PREFIX}${sessionId}`,
      newValue: JSON.stringify(updated),
    }));
  }, [sessionId]);

  // ── Merge a snapshot into an existing (possibly empty) session ───────────
  const mergeSnapshot = (base: SessionData, snap: Partial<SessionData>): SessionData => ({
    ...base,
    sapItems: snap.sapItems?.length ? snap.sapItems : base.sapItems,
    ranges: snap.ranges?.length ? snap.ranges : base.ranges,
    pdpOverrides: (snap as any).pdpOverrides ?? (base as any).pdpOverrides ?? {},
    products: snap.products?.length ? snap.products : base.products,
    // Keep expiresAt from snap so the session doesn't immediately expire
    expiresAt: snap.expiresAt ?? base.expiresAt,
    settings: snap.settings ?? base.settings,
  });

  // ── Load session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    // 1. Check URL for a snapshot param (cross-device sharing)
    const urlParams = new URLSearchParams(window.location.search);
    const snapParam = urlParams.get('snap');
    const snapData = snapParam ? decodeSessionSnapshot(snapParam) : null;

    // If we decoded a snap, strip it from the URL immediately (clean URL)
    if (snapParam) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // 2. Try existing localStorage data
    const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);

    let parsedSession: SessionData | null = null;

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionData;
        if (new Date(parsed.expiresAt) < new Date()) {
          // Expired — but if we have a snap, use it to refresh
          if (snapData) {
            parsedSession = mergeSnapshot(createDefaultSession(sessionId), snapData);
          } else {
            setError('This demo session has expired. Please generate a new session.');
            localStorage.removeItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
            setIsLoading(false);
            return;
          }
        } else {
          parsedSession = parsed;
          // If we also got a snap, merge it in (snap may have newer data)
          if (snapData) {
            parsedSession = mergeSnapshot(parsedSession, snapData);
          }
        }
      } catch {
        setError('Invalid session data.');
        setIsLoading(false);
        return;
      }
    } else if (snapData) {
      // No local storage yet — bootstrap from snapshot
      parsedSession = mergeSnapshot(createDefaultSession(sessionId), snapData);
    } else {
      // Completely new session — create blank
      parsedSession = createDefaultSession(sessionId);
    }

    // 3. Migrate old fields
    if (!parsedSession.products) parsedSession.products = [];
    if (!parsedSession.cart) parsedSession.cart = createDefaultCart();
    if (!parsedSession.activeUsers) parsedSession.activeUsers = [];
    if (!parsedSession.settings) {
      parsedSession.settings = { theme: 'hilti', currency: 'USD', collaborationEnabled: true };
    }
    if (!parsedSession.sapItems) parsedSession.sapItems = [];
    if (!parsedSession.ranges) parsedSession.ranges = [];
    if (!(parsedSession as any).pdpOverrides) (parsedSession as any).pdpOverrides = {};

    // 4. Initialize user
    const user = initializeUser(parsedSession);
    setCurrentUser(user);

    // 5. Persist and set state
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(parsedSession));
    setSession(parsedSession);
    setIsLoading(false);
  }, [sessionId, initializeUser]);

  // ── BroadcastChannel (same-browser tab sync) ─────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    channelRef.current = new BroadcastChannel(`session_${sessionId}`);

    channelRef.current.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const { type, userId, username } = event.data;
      if (userId === currentUser?.userId) return;

      if (type === 'SESSION_UPDATED') {
        // Another tab updated the session — reload from localStorage
        const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        if (stored) {
          try { setSession(JSON.parse(stored)); } catch {}
        }
      } else if (type === 'USER_JOINED') {
        toast.success(`${username || 'A new user'} joined the session`, { icon: '👋', duration: 3000 });
        const stored = localStorage.getItem(`${SESSION_STORAGE_PREFIX}${sessionId}`);
        if (stored) {
          try { setSession(JSON.parse(stored)); } catch {}
        }
      }
    };

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [sessionId, currentUser?.userId]);

  // ── Heartbeat ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const sendHeartbeat = () => {
      channelRef.current?.postMessage({
        type: 'HEARTBEAT',
        userId: currentUser.userId,
        username: currentUser.username,
        timestamp: Date.now(),
      } satisfies BroadcastMessage);
    };

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionId, currentUser]);

  // ── Storage event (cross-tab on same origin) ─────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${SESSION_STORAGE_PREFIX}${sessionId}` && e.newValue) {
        try { setSession(JSON.parse(e.newValue)); } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [sessionId]);

  // ── getUserInfo helper ────────────────────────────────────────────────────
  const getUserInfo = useCallback((): UserInfo | undefined => {
    if (!currentUser) return undefined;
    return {
      userId: currentUser.userId,
      username: currentUser.username,
      color: currentUser.color,
      timestamp: Date.now(),
    };
  }, [currentUser]);

  // ── Notify product change ────────────────────────────────────────────────
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
    } satisfies BroadcastMessage);
  }, [currentUser]);

  // ── CRUD: Products ───────────────────────────────────────────────────────
  const createProduct = useCallback((): ProductData | null => {
    if (!session) return null;
    const newProduct = createDefaultProduct();
    const userInfo = getUserInfo();
    if (userInfo) {
      newProduct.createdBy = userInfo;
      newProduct.lastModifiedBy = userInfo;
    }
    const updated = { ...session, products: [...session.products, newProduct] };
    saveSession(updated);
    notifyProductChange('CREATE', newProduct);
    return newProduct;
  }, [session, getUserInfo, saveSession, notifyProductChange]);

  const updateProduct = useCallback((productId: string, updates: Partial<ProductData>) => {
    if (!session) return;
    const userInfo = getUserInfo();
    const updated = {
      ...session,
      products: session.products.map(p =>
        p.productId === productId
          ? { ...p, ...updates, lastModified: new Date().toISOString(), lastModifiedBy: userInfo }
          : p
      ),
    };
    saveSession(updated);
    const updatedProduct = updated.products.find(p => p.productId === productId);
    if (updatedProduct) notifyProductChange('UPDATE', updatedProduct);
  }, [session, getUserInfo, saveSession, notifyProductChange]);

  const deleteProduct = useCallback((productId: string) => {
    if (!session) return;
    const product = session.products.find(p => p.productId === productId);
    const updated = { ...session, products: session.products.filter(p => p.productId !== productId) };
    saveSession(updated);
    if (product) notifyProductChange('DELETE', product);
  }, [session, saveSession, notifyProductChange]);

  const duplicateProduct = useCallback((productId: string): ProductData | null => {
    if (!session) return null;
    const original = session.products.find(p => p.productId === productId);
    if (!original) return null;
    const userInfo = getUserInfo();
    const duplicate: ProductData = {
      ...original,
      productId: `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: userInfo,
      lastModifiedBy: userInfo,
    };
    const updated = { ...session, products: [...session.products, duplicate] };
    saveSession(updated);
    notifyProductChange('CREATE', duplicate);
    return duplicate;
  }, [session, getUserInfo, saveSession, notifyProductChange]);

  const getProductById = useCallback((productId: string): ProductData | undefined => {
    return session?.products.find(p => p.productId === productId);
  }, [session]);

  // ── CRUD: Cart ───────────────────────────────────────────────────────────
  const addToCart = useCallback((product: ProductData, quantity: number = 1) => {
    if (!session) return;
    const existing = session.cart.items.find(i => i.productId === product.productId);
    let newItems: CartItem[];
    if (existing) {
      newItems = session.cart.items.map(i =>
        i.productId === product.productId ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      newItems = [...session.cart.items, {
        productId: product.productId,
        productName: product.name,
        price: product.price,
        quantity,
        thumbnail: product.primaryImage,
      }];
    }
    const subtotal = newItems.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.quantity, 0);
    const itemCount = newItems.reduce((s, i) => s + i.quantity, 0);
    const cart: CartData = { items: newItems, subtotal, itemCount, lastUpdated: new Date().toISOString() };
    saveSession({ ...session, cart });
  }, [session, saveSession]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (!session) return;
    const newItems = quantity <= 0
      ? session.cart.items.filter(i => i.productId !== productId)
      : session.cart.items.map(i => i.productId === productId ? { ...i, quantity } : i);
    const subtotal = newItems.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.quantity, 0);
    const itemCount = newItems.reduce((s, i) => s + i.quantity, 0);
    saveSession({ ...session, cart: { items: newItems, subtotal, itemCount, lastUpdated: new Date().toISOString() } });
  }, [session, saveSession]);

  const removeFromCart = useCallback((productId: string) => {
    updateCartQuantity(productId, 0);
  }, [updateCartQuantity]);

  const clearCart = useCallback(() => {
    if (!session) return;
    saveSession({ ...session, cart: createDefaultCart() });
  }, [session, saveSession]);

  // ── Misc ─────────────────────────────────────────────────────────────────
  const getOnlineUsers = useCallback((): ActiveUser[] => {
    if (!session) return [];
    return session.activeUsers.filter(u => u.isOnline);
  }, [session]);

  const getProductsByCreator = useCallback((creatorId: string | null): ProductData[] => {
    if (!session) return [];
    if (!creatorId) return session.products;
    return session.products.filter(p => p.createdBy?.userId === creatorId);
  }, [session]);

  const getProductCountsByUser = useCallback((): Map<string, number> => {
    const counts = new Map<string, number>();
    if (!session) return counts;
    session.products.forEach(p => {
      const uid = p.createdBy?.userId || 'unknown';
      counts.set(uid, (counts.get(uid) || 0) + 1);
    });
    return counts;
  }, [session]);

  // ── updateSession (used by SAP Portal + WorkBench) ───────────────────────
  const updateSession = useCallback((updatedSession: SessionData) => {
    if (!sessionId) return;
    setSession(updatedSession);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${sessionId}`, JSON.stringify(updatedSession));
    // Broadcast so other tabs know
    channelRef.current?.postMessage({
      type: 'SESSION_UPDATED',
      userId: currentUser?.userId ?? '',
      timestamp: Date.now(),
    } satisfies BroadcastMessage);
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${SESSION_STORAGE_PREFIX}${sessionId}`,
      newValue: JSON.stringify(updatedSession),
    }));
  }, [sessionId, currentUser]);

  // ── resetSession ─────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    if (!sessionId) return;
    const newSession = createDefaultSession(sessionId);
    if (currentUser) newSession.activeUsers.push(currentUser);
    saveSession(newSession);
    toast.success('Session reset');
  }, [sessionId, currentUser, saveSession]);

  // ── createSession ─────────────────────────────────────────────────────────
  const createSession = useCallback(() => {
    const newId = generateSessionId();
    const newSession = createDefaultSession(newId);
    localStorage.setItem(`${SESSION_STORAGE_PREFIX}${newId}`, JSON.stringify(newSession));
    return newId;
  }, []);

  return {
    session,
    products: session?.products ?? [],
    cart: session?.cart ?? createDefaultCart(),
    activeUsers: session?.activeUsers ?? [],
    currentUser,
    isLoading,
    error,
    isValid: !!session && !error,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    getProductById,
    getProductsByCreator,
    getProductCountsByUser,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getOnlineUsers,
    updateSession,
    resetSession,
    createSession,
  };
};
