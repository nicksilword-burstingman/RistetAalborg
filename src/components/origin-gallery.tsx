"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { CoffeeId } from "@/lib/catalog";
import { coffeeOrigins } from "@/lib/coffee-origins";

export function OriginGallery({ coffeeId }: { coffeeId: CoffeeId }) {
  const origin = coffeeOrigins[coffeeId];
  const gallery = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gallery.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    observer.observe(gallery.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={gallery}
      className="origin-gallery"
      data-paused={paused || !visible}
    >
      <div
        className="origin-gallery-window"
        tabIndex={0}
        role="region"
        aria-label="Billeder fra kaffens oprindelse"
      >
        <div className="origin-gallery-track">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className={`origin-gallery-group ${copy ? "origin-gallery-copy" : ""}`}
              aria-hidden={copy ? true : undefined}
            >
              {origin.images.map((photo) => (
                <figure
                  key={photo.src}
                  className={`origin-slide ${photo.height > photo.width ? "origin-slide-portrait" : ""}`}
                >
                  <Image
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt={copy ? "" : photo.alt}
                    sizes="(max-width: 760px) 85vw, 48vw"
                    style={{ objectPosition: photo.focus ?? "center" }}
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="origin-gallery-control"
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
        {paused ? "Afspil billedrækken" : "Sæt billedrækken på pause"}
      </button>
    </div>
  );
}
