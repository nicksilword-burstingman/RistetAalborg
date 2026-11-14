"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  CART_STORAGE_KEY,
  cartItemKey,
  parseCart,
  quoteCart,
  type CartItem,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  storageError: string;
  quantity: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const currentItems = useRef<CartItem[]>([]);

  useEffect(() => {
    const readStored = () => {
      try {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        const next = stored ? parseCart(JSON.parse(stored)) : [];
        currentItems.current = next;
        setItems(next);
      } catch {
        setStorageError(
          "Kurven kan ikke gemmes i denne browser. Dine valg bliver her, så længe siden er åben.",
        );
      }
    };
    readStored();
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) readStored();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const persist = (next: CartItem[]) => {
    currentItems.current = next;
    setItems(next);
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      setStorageError(
        "Kurven kan ikke gemmes i denne browser. Dine valg bliver her, så længe siden er åben.",
      );
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        ready,
        storageError,
        quantity: quoteCart(items).quantity,
        addItem: (item) => persist(addCartItem(currentItems.current, item)),
        updateQuantity: (key, quantity) =>
          persist(
            parseCart(
              currentItems.current.map((item) =>
                cartItemKey(item) === key ? { ...item, quantity } : item,
              ),
            ),
          ),
        removeItem: (key) =>
          persist(
            currentItems.current.filter((item) => cartItemKey(item) !== key),
          ),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Kurven skal bruges inden for CartProvider.");
  return cart;
}
