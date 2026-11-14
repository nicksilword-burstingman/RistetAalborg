"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Pause, Play } from "lucide-react";

export function FilmIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackChoice = useRef<"auto" | "play" | "pause">("auto");
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;
    if (!video) return;
    let visible = true;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;

    const syncMotion = () => {
      if (
        playbackChoice.current === "pause" ||
        document.hidden ||
        !visible ||
        ((preference.matches || saveData) && playbackChoice.current !== "play")
      ) {
        video.pause();
        setPlaying(false);
      } else {
        void video
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }
    };

    syncMotion();
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncMotion();
      },
      { threshold: 0.05 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", syncMotion);
    preference.addEventListener("change", syncMotion);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncMotion);
      observer.disconnect();
      video.pause();
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      playbackChoice.current = "play";
      void video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      playbackChoice.current = "pause";
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <section className="film-intro" aria-labelledby="film-title">
        <video
          ref={videoRef}
          className="film-intro-video"
          poster="/video/coffee-origins-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => {
            setPlaying(false);
            setUnavailable(true);
          }}
        >
          <source
            src="/video/coffee-origins.mp4"
            type="video/mp4"
            onError={() => {
              setPlaying(false);
              setUnavailable(true);
            }}
          />
        </video>
        <div className="film-intro-shade" aria-hidden="true" />
        <div className="film-intro-top" aria-hidden="true">
          <span>ET LILLE RISTERI. EN STOR KÆRLIGHED TIL KAFFE.</span>
          <span>FRA BÆR TIL BØNNE</span>
        </div>
        <div className="film-intro-content">
          <p className="film-intro-eyebrow">RISTET I AALBORG · TIL DIG</p>
          <h1 id="film-title">
            Friskristet på bestilling.
            <br />
            <em>Helt nede på jorden.</em>
          </h1>
          <p className="film-intro-description">
            Specialkaffe med karakter. En pris, flere kan være med på. Vi rister
            først, når du bestiller.
          </p>
          <Link href="/shop" className="film-intro-link">
            Find din kaffe <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className="film-intro-bottom">
          <a href="#forsiden" className="film-intro-scroll">
            Se mere af historien <ArrowDownRight size={19} aria-hidden="true" />
          </a>
          <div className="film-intro-bottom-right">
            <Link href="/information/filmen" className="film-source-link">
              Om filmen
            </Link>
            <button
              type="button"
              className="film-intro-control"
              onClick={togglePlayback}
              aria-label={playing ? "Sæt filmen på pause" : "Afspil filmen"}
              aria-pressed={playing}
              disabled={unavailable}
            >
              {playing ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              <span>
                {unavailable ? "Billede vises" : playing ? "Pause" : "Afspil"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
