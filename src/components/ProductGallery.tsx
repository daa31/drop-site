"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  const [origin, setOrigin] = useState("50% 50%");
  const current = images[i]?.url;

  return (
    <div className="min-w-0">
      <div
        className="group relative aspect-[4/3] min-h-[260px] w-full overflow-hidden rounded-r-lg border-y border-r border-black/10 bg-white shadow-card sm:min-h-[340px] lg:min-h-[440px] xl:min-h-[480px]"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
        onMouseLeave={() => setOrigin("50% 50%")}
      >
        {current ? (
          <Image
            src={current}
            alt={alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 52vw, 100vw"
            style={{ transformOrigin: origin }}
            className="bg-white object-contain p-3 transition duration-300 group-hover:scale-[1.45] sm:p-5"
          />
        ) : (
          <div className="grid h-full place-items-center text-graphite/30">Locko</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button key={img.url + idx} onClick={() => setI(idx)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white ${i === idx ? "border-ink" : "border-black/10"}`}>
              <Image src={img.url} alt="" width={80} height={80} sizes="80px" className="h-full w-full object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
