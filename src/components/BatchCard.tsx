"use client";

import Link from "next/link";
import Image from "next/image";
import type { Batch } from "@/lib/types";

export default function BatchCard({ batch }: { batch: Batch }) {
  return (
    <Link href={`/batch/${batch.batchId}`}>
      <div className="card-gradient rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
              Active Batch
            </span>
          </div>
        </div>
        <h3 className="text-white font-bold text-base mb-3 line-clamp-2 leading-tight">
          {batch.batchName}
        </h3>
        {batch.batchImage && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-bg-secondary">
            <Image
              src={batch.batchImage}
              alt={batch.batchName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}
      </div>
    </Link>
  );
}
