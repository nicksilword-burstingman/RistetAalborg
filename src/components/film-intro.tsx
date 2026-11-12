"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Pause, Play } from "lucide-react";

export function FilmIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;
    if (!video) return;

    const syncMotion = () => {
      if (preference.matches) {
        video.pause();
        video.currentTime = 0;
        setPlaying(false);
      } else {
        void video
          .play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }
    };

    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => {
      preference.removeEventListener("change", syncMotion);
      video.pause();
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
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
          poster="/video/espresso-poster.jpg"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/video/espresso-ritual.webm" type="video/webm" />
        </video>
        <div className="film-intro-shade" aria-hidden="true" />
        <div className="film-intro-top" aria-hidden="true">
          <span>ET LILLE RISTERI. EN STOR KÆRLIGHED TIL KAFFE.</span>
          <span>01 / 02</span>
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
            <button
              type="button"
              className="film-intro-control"
              onClick={togglePlayback}
              aria-label={playing ? "Sæt filmen på pause" : "Afspil filmen"}
              aria-pressed={playing}
            >
              {playing ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              <span>{playing ? "Pause" : "Afspil"}</span>
            </button>
          </div>
        </div>
      </section>
      <p className="film-source">
        Illustrativ kaffefilm:{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Sunday_Morning_Espresso_Routine_-_Grind_%2B_distribute_%2B_tamp_%2B_extraction_(15-Second_Abridged_Version).webm"
          target="_blank"
          rel="noreferrer"
        >
          Scott Schiller
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/2.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 2.0
        </a>{" "}
        · vist uden lyd og beskåret til skærmen.
      </p>
    </>
  );
}
