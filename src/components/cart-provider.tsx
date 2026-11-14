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
import {
  parseSubscriptions,
  saveSubscriptionSelection,
  subscriptionKey,
  subscriptionSettingsSchema,
  type SubscriptionSelection,
  type SubscriptionSettings,
} from "@/lib/subscriptions";

const SUBSCRIPTION_STORAGE_KEY = "ristet-subscriptions-v1";

type CartContextValue = {
  items: CartItem[];
  subscriptions: SubscriptionSelection[];
  subscriptionSettings: SubscriptionSettings | null;
  subscriptionError: string;
  saveSubscription: (item: SubscriptionSelection, previousKey?: string) => void;
  removeSubscription: (key: string) => void;
  ready: boolean;
  storageError: string;
  quantity: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  consumeOrder: (orderId: string, purchased: CartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const currentItems = useRef<CartItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSelection[]>(
    [],
  );
  const currentSubscriptions = useRef<SubscriptionSelection[]>([]);
  const [subscriptionSettings, setSubscriptionSettings] =
    useState<SubscriptionSettings | null>(null);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    const readStored = () => {
      try {
        const stored = window.localStorage.getItem(CART_STORAGE_KEY);
        const next = stored ? parseCart(JSON.parse(stored)) : [];
        currentItems.current = next;
        setItems(next);
        const rawSubscriptions = window.localStorage.getItem(
          SUBSCRIPTION_STORAGE_KEY,
        );
        const selections = rawSubscriptions
          ? parseSubscriptions(JSON.parse(rawSubscriptions))
          : [];
        currentSubscriptions.current = selections;
        setSubscriptions(selections);
      } catch {
        setStorageError(
          "Kurven kan ikke gemmes i denne browser. Dine valg bliver her, så længe siden er åben.",
        );
      }
    };
    readStored();
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (
        event.key === CART_STORAGE_KEY ||
        event.key === SUBSCRIPTION_STORAGE_KEY ||
        event.key === null
      )
        readStored();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/subscriptions", { cache: "no-store", signal: abort.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) =>
        setSubscriptionSettings(
          subscriptionSettingsSchema.parse(data.settings),
        ),
      )
      .catch(() => {
        if (!abort.signal.aborted)
          setSubscriptionError(
            "Abonnementspriserne kunne ikke hentes. Genindlæs siden for at prøve igen.",
          );
      });
    return () => abort.abort();
  }, []);

  const persistSubscriptions = (next: SubscriptionSelection[]) => {
    currentSubscriptions.current = next;
    setSubscriptions(next);
    try {
      window.localStorage.setItem(
        SUBSCRIPTION_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      setStorageError(
        "Dine kaffevalg kan ikke gemmes i denne browser. Behold siden åben.",
      );
    }
  };

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
        subscriptions,
        subscriptionSettings,
        subscriptionError,
        saveSubscription: (item, previousKey) =>
          persistSubscriptions(
            saveSubscriptionSelection(
              currentSubscriptions.current,
              item,
              previousKey,
            ),
          ),
        removeSubscription: (key) =>
          persistSubscriptions(
            currentSubscriptions.current.filter(
              (item) => subscriptionKey(item) !== key,
            ),
          ),
        ready,
        storageError,
        quantity:
          quoteCart(items).quantity +
          subscriptions.reduce((sum, item) => sum + item.quantity, 0),
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
        consumeOrder: (orderId, purchased) => {
          // Only called after the private order endpoint confirms a verified payment.
          // Keep additions made since checkout, and do not consume a receipt twice.
          try {
            const receiptKey = "ristet-consumed-orders-v1";
            const raw: unknown = JSON.parse(
              window.localStorage.getItem(receiptKey) || "[]",
            );
            const receipts = Array.isArray(raw)
              ? raw.filter((id): id is string => typeof id === "string")
              : [];
            if (receipts.includes(orderId)) return;
            window.localStorage.setItem(
              receiptKey,
              JSON.stringify([...receipts.slice(-99), orderId]),
            );
            persist(
              currentItems.current.flatMap((item) => {
                const bought = purchased
                  .filter((p) => cartItemKey(p) === cartItemKey(item))
                  .reduce((sum, p) => sum + p.quantity, 0);
                const quantity = Math.max(0, item.quantity - bought);
                return quantity ? [{ ...item, quantity }] : [];
              }),
            );
          } catch {
            setStorageError(
              "Din betaling er bekræftet, men kurven kunne ikke opdateres i denne browser. Du kan selv fjerne de købte poser.",
            );
          }
        },
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
