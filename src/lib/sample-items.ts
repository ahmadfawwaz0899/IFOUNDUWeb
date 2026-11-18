import type { CategoryId } from "@/lib/categories";

/**
 * PLACEHOLDER DATA — used only so the screens have something to show.
 * This will be replaced by real reports from the Supabase database.
 */
export type Item = {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  status: "found" | "lost";
  location: string;
  when: string;
};

export const sampleItems: Item[] = [
  {
    id: "1",
    title: "Black iPhone 13",
    description: "Blue silicone case, small crack on the top-left corner.",
    category: "phone",
    status: "found",
    location: "Library, Level 2",
    when: "2 hours ago",
  },
  {
    id: "2",
    title: "Brown leather wallet",
    description: "Bifold wallet, no cash inside. Has a student card.",
    category: "wallet",
    status: "found",
    location: "Cafeteria",
    when: "5 hours ago",
  },
  {
    id: "3",
    title: "Car keys with red keychain",
    description: "Honda key with a red lanyard keychain.",
    category: "keys",
    status: "found",
    location: "Bus stop, Main Gate",
    when: "Yesterday",
  },
  {
    id: "4",
    title: "Grey laptop backpack",
    description: "Grey backpack, laptop sleeve, water bottle on the side.",
    category: "bag",
    status: "lost",
    location: "Lecture Hall B",
    when: "Yesterday",
  },
  {
    id: "5",
    title: "Wireless earbuds case",
    description: "White charging case, no earbuds inside.",
    category: "electronics",
    status: "found",
    location: "Sports Complex",
    when: "2 days ago",
  },
  {
    id: "6",
    title: "Student ID card",
    description: "Card details hidden for privacy. Ask the finder to verify.",
    category: "id-card",
    status: "found",
    location: "Engineering Block",
    when: "3 days ago",
  },
];
