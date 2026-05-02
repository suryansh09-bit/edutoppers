import { Suspense } from "react";
import WatchClient from "./WatchClient";

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: "rgba(2,4,12,0.98)" }}>
        <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <WatchClient />
    </Suspense>
  );
}
