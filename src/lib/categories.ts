import {
  Backpack,
  IdCard,
  KeyRound,
  Laptop,
  Package,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "phone"
  | "wallet"
  | "keys"
  | "bag"
  | "id-card"
  | "electronics"
  | "other";

export const categories: { id: CategoryId; label: string; icon: LucideIcon }[] = [
  { id: "phone", label: "Phones", icon: Smartphone },
  { id: "wallet", label: "Wallets", icon: Wallet },
  { id: "keys", label: "Keys", icon: KeyRound },
  { id: "bag", label: "Bags", icon: Backpack },
  { id: "id-card", label: "Cards & IDs", icon: IdCard },
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "other", label: "Others", icon: Package },
];

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id) ?? categories[categories.length - 1];
}
