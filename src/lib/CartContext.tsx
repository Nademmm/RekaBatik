import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./AuthContext";

interface CartItemWithRelations {
  id: string;
  user_id: string;
  batik_id?: number;
  custom_design_id?: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  batik_items?: any;
  custom_designs?: any;
}

interface CartContextType {
  cartCount: number;
  cartItems: any[];
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (options: { batikId?: number; customDesignId?: number; quantity?: number }) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchFullCart: () => Promise<CartItemWithRelations[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const realtimeRefreshTimerRef = useRef<number | null>(null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFullCart = useCallback(async (): Promise<CartItemWithRelations[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, batik_items(*), custom_designs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Failed to fetch full cart:", err);
      return [];
    }
  }, [user]);

  const addToCart = useCallback(async (options: { batikId?: number; customDesignId?: number; quantity?: number }) => {
    if (!user) return;
    const { batikId, customDesignId, quantity = 1 } = options;

    try {
      // Check if item already exists
      const query = supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id);

      if (batikId) {
        query.eq("batik_id", batikId);
      } else if (customDesignId) {
        query.eq("custom_design_id", customDesignId);
      } else {
        return;
      }

      const { data: existing } = await query.single();

      if (existing) {
        // Update existing item
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        
        if (error) throw error;
        
        // Optimistic update
        setCartItems(prev => prev.map(item => 
          item.id === existing.id 
            ? { ...item, quantity: existing.quantity + quantity } 
            : item
        ));
      } else {
        // Insert new item
        const insertData: any = {
          user_id: user.id,
          quantity,
        };
        if (batikId) insertData.batik_id = batikId;
        if (customDesignId) insertData.custom_design_id = customDesignId;

        const { data: newItem, error } = await supabase
          .from("cart_items")
          .insert([insertData])
          .select("*")
          .single();
        
        if (error) throw error;
        
        // Optimistic update
        if (newItem) {
          setCartItems(prev => [...prev, newItem]);
        }
      }
    } catch (err) {
      console.error("Failed to add to cart:", err);
      throw err;
    }
  }, [user]);

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (!user) return;
    
    // Optimistic update
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId)
        .eq("user_id", user.id);
      
      if (error) {
        // Revert on error
        fetchCart();
        throw error;
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
      throw err;
    }
  }, [user, fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!user) return;
    
    // Optimistic update
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);
      
      if (error) {
        // Revert on error
        fetchCart();
        throw error;
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
      throw err;
    }
  }, [user, fetchCart]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    
    // Optimistic update
    setCartItems([]);

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);
      
      if (error) {
        // Revert on error
        fetchCart();
        throw error;
      }
    } catch (err) {
      console.error("Failed to clear cart:", err);
      throw err;
    }
  }, [user, fetchCart]);

  // Initial fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("cart-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (realtimeRefreshTimerRef.current) {
            window.clearTimeout(realtimeRefreshTimerRef.current);
          }

          realtimeRefreshTimerRef.current = window.setTimeout(() => {
            fetchCart();
          }, 150);
        }
      )
      .subscribe();

    return () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user, fetchCart]);

  const contextValue = useMemo(
    () => ({
      cartCount,
      cartItems,
      isLoading,
      refreshCart: fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      fetchFullCart,
    }),
    [cartCount, cartItems, isLoading, fetchCart, addToCart, updateQuantity, removeItem, clearCart, fetchFullCart]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
