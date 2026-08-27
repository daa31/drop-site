"use client";

import { useState } from "react";

export function ProductGallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const current = images[i]?.url;
  return (
    <div>
      <button className="relative w-full overflow-hidden rounded-3xl bg-mist" onClick={() => setFull(true)}>
        {current && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={alt} className="aspect-square w-full object-contain bg-white" />
        )}
      </button>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={img.url + idx}
            onClick={() => setI(idx)}
            className={`h-16 w-16 overflow-hidden rounded-xl border ${i === idx ? "border-ink" : "border-transparent"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {full && current && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/90 p-6" onClick={() => setFull(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
