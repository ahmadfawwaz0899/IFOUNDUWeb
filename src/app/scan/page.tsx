import type { Metadata } from "next";
import { ScanView } from "./scan-view";

export const metadata: Metadata = { title: "Scan an item" };

export default function ScanPage() {
  return <ScanView />;
}
