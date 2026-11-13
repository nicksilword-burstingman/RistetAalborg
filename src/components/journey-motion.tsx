"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { timelineProgress } from "@/lib/timeline";

/** Enhances server-rendered content; without JS, the full story stays readable. */
export function JourneyMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const track = root?.querySelector<HTMLElement>(".journey-track");
    if (!root || !track) return;
    const heading = root.querySelector<HTMLElement>(".journey-heading");
    const entries = Array.from(
      track.querySelectorAll<HTMLElement>(".journey-entry"),
    );
    const dots = entries.map((entry) =>
      entry.querySelector<HTMLElement>(".journey-dot")!,
    );
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let offsets: number[] = [];
    let entryTops: number[] = [];
    let first = 0,
      length = 1,
      frame = 0;
    const update = () => {
      frame = 0;
      const top = track.getBoundingClientRect().top;
      const viewport = window.innerHeight;
      const reduced = preference.matches;
      root.dataset.enhanced = String(!reduced);
      track.style.setProperty(
        "--journey-progress",
        String(reduced ? 1 : timelineProgress(top + first, length, viewport)),
      );
      entries.forEach((entry, index) => {
        entry.dataset.reached = String(
          reduced || top + offsets[index] <= viewport * 0.62,
        );
        entry.dataset.visible = String(
          reduced || top + entryTops[index] <= viewport * 0.9,
        );
      });
      if (heading)
        heading.dataset.visible = String(
          reduced || heading.getBoundingClientRect().top <= viewport * 0.9,
        );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      const trackTop = track.getBoundingClientRect().top;
      offsets = dots.map(
        (dot) =>
          dot.getBoundingClientRect().top - trackTop + dot.offsetHeight / 2,
      );
      entryTops = entries.map(
        (entry) => entry.getBoundingClientRect().top - trackTop,
      );
      first = offsets[0] || 0;
      length = Math.max(1, (offsets.at(-1) || first) - first);
      track.style.setProperty("--journey-line-start", `${first}px`);
      track.style.setProperty("--journey-line-length", `${length}px`);
      schedule();
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(track);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    preference.addEventListener("change", schedule);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      preference.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div ref={rootRef} className="journey-motion">
      {children}
    </div>
  );
}
