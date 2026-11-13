"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ImagePlus,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  orderChapters,
  type TimelineChapter,
  type TimelineDocument,
  type TimelineImage,
} from "@/lib/timeline";

export function TimelineEditor({
  initialDocument,
}: {
  initialDocument: TimelineDocument;
}) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [selected, setSelected] = useState(initialDocument.chapters[0].id);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "upload" | "logout" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const chapters = orderChapters(document.chapters);
  const chapter = chapters.find((c) => c.id === selected) || chapters[0];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(update: (doc: TimelineDocument) => TimelineDocument) {
    setDocument(update);
    setDirty(true);
    setNotice("");
    setError("");
  }
  function updateChapter(values: Partial<TimelineChapter>, id = chapter.id) {
    change((doc) => ({
      ...doc,
      chapters: doc.chapters.map((c) =>
        c.id === id ? { ...c, ...values } : c,
      ),
    }));
  }
  function updateImage(id: string, values: Partial<TimelineImage>) {
    updateChapter({
      images: chapter.images.map((i) =>
        i.id === id ? { ...i, ...values } : i,
      ),
    });
  }
  function choose(id: string) {
    setSelected(id);
    requestAnimationFrame(() =>
      editorHeading.current?.focus({ preventScroll: true }),
    );
  }
  function moveChapter(direction: number) {
    const normal = chapters.filter((c) => !c.isFuture);
    const index = normal.findIndex((c) => c.id === chapter.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= normal.length) return;
    [normal[index], normal[target]] = [normal[target], normal[index]];
    change((doc) => ({
      ...doc,
      chapters: [
        ...normal.map((c, sortOrder) => ({ ...c, sortOrder })),
        ...chapters.filter((c) => c.isFuture),
      ],
    }));
  }
  function moveImage(id: string, direction: number) {
    const images = [...chapter.images].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const index = images.findIndex((i) => i.id === id);
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    updateChapter({
      images: images.map((i, sortOrder) => ({ ...i, sortOrder })),
    });
  }

  async function upload(files: FileList | null, replaceId?: string) {
    if (!files?.length || busy) return;
    if (!replaceId && chapter.images.length + files.length > 8) {
      setError("Der er plads til højst 8 billeder pr. kapitel.");
      return;
    }
    const targetId = chapter.id;
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.set("file", file);
        const response = await fetch("/api/admin/billeder", {
          method: "POST",
          body: data,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        change((doc) => ({
          ...doc,
          chapters: doc.chapters.map((c) => {
            if (c.id !== targetId) return c;
            const image: TimelineImage = {
              ...result,
              alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
              caption: "",
              focusX: 50,
              focusY: 50,
              crop: "auto",
              sortOrder: c.images.length,
            };
            return {
              ...c,
              images: replaceId
                ? c.images.map((i) =>
                    i.id === replaceId
                      ? {
                          ...i,
                          src: image.src,
                          width: image.width,
                          height: image.height,
                        }
                      : i,
                  )
                : [...c.images, image],
            };
          }),
        }));
      }
      setNotice(
        "Billederne er uploadet. Tilføj beskrivende billedtekster, og gem historien.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload mislykkedes.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/timeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDocument(result);
      setDirty(false);
      setNotice("Gemt. Historien på Om os er nu opdateret.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke gemme.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">RISTET AALBORG / ADMINISTRATION</p>
          <h1>
            Din historie.
            <br />
            <em>Dit næste kapitel.</em>
          </h1>
        </div>
        <button
          className="admin-quiet"
          type="button"
          disabled={Boolean(busy)}
          onClick={async () => {
            if (
              dirty &&
              !window.confirm(
                "Du har ændringer, der ikke er gemt. Vil du logge ud alligevel?",
              )
            )
              return;
            setBusy("logout");
            try {
              const r = await fetch("/api/admin/logout", { method: "POST" });
              if (!r.ok) throw new Error();
              setDirty(false);
              router.refresh();
            } catch {
              setError("Kunne ikke logge ud. Prøv igen.");
            } finally {
              setBusy(null);
            }
          }}
        >
          <LogOut size={16} />
          Log ud
        </button>
      </div>
      <div className="admin-savebar">
        <span>
          {dirty
            ? "Du har ændringer, der ikke er gemt"
            : "Alle ændringer er gemt"}
        </span>
        <a href="/om-os" target="_blank" rel="noreferrer">
          Se Om os <ArrowUpRight size={16} />
        </a>
        <button
          type="button"
          className="button dark"
          disabled={!dirty || Boolean(busy)}
          onClick={save}
        >
          <Save size={16} />
          {busy === "save" ? "Gemmer …" : "Gem og offentliggør"}
        </button>
      </div>
      <div className="admin-feedback" aria-live="polite">
        {notice && (
          <p role="status">
            <Check size={16} />
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        {busy === "upload" && <p>Uploader og optimerer billeder …</p>}
      </div>
      <div className="timeline-editor">
        <aside className="admin-chapters" aria-label="Kapitler i historien">
          <h2>
            Dine kapitler <span>{chapters.length}</span>
          </h2>
          <ol>
            {chapters.map((c, index) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={c.id === chapter.id ? "true" : undefined}
                  onClick={() => choose(c.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <small>{c.period}</small>
                    {c.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="admin-add"
            disabled={Boolean(busy) || chapters.length >= 100}
            onClick={() => {
              const id = crypto.randomUUID();
              change((doc) => ({
                ...doc,
                chapters: [
                  ...doc.chapters,
                  {
                    id,
                    period: "Nyt kapitel",
                    dateTime: "",
                    title: "En ny milepæl",
                    body: "Fortæl, hvad der er sket …",
                    sortOrder: chapters.filter((c) => !c.isFuture).length,
                    isFuture: false,
                    images: [],
                  },
                ],
              }));
              choose(id);
            }}
          >
            <Plus size={18} />
            Tilføj et kapitel
          </button>
          <button
            type="button"
            className="admin-quiet"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(document, null, 2)], {
                  type: "application/json",
                }),
              );
              const link = window.document.createElement("a");
              link.href = url;
              link.download = "ristet-historie.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Eksportér historien
          </button>
        </aside>
        <div className="admin-edit-panel" key={chapter.id}>
          <div className="admin-edit-heading">
            <div>
              <p className="eyebrow">REDIGER KAPITEL</p>
              <h2 ref={editorHeading} tabIndex={-1}>
                {chapter.title}
              </h2>
            </div>
            <div className="admin-order">
              <button
                type="button"
                aria-label="Flyt kapitlet op"
                title="Flyt op"
                disabled={
                  Boolean(busy) ||
                  chapter.isFuture ||
                  chapters[0].id === chapter.id
                }
                onClick={() => moveChapter(-1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                aria-label="Flyt kapitlet ned"
                title="Flyt ned"
                disabled={
                  Boolean(busy) ||
                  chapter.isFuture ||
                  chapters.filter((c) => !c.isFuture).at(-1)?.id === chapter.id
                }
                onClick={() => moveChapter(1)}
              >
                <ArrowDown size={18} />
              </button>
            </div>
          </div>
          <fieldset disabled={Boolean(busy)}>
            <label>
              Dato eller periode
              <input
                value={chapter.period}
                maxLength={100}
                onChange={(e) =>
                  updateChapter({ period: e.target.value, dateTime: "" })
                }
              />
            </label>
            <label>
              Overskrift
              <input
                value={chapter.title}
                maxLength={160}
                onChange={(e) => updateChapter({ title: e.target.value })}
              />
            </label>
            <label>
              Historien
              <textarea
                rows={12}
                value={chapter.body}
                maxLength={10000}
                onChange={(e) => updateChapter({ body: e.target.value })}
              />
              <small>
                Lav nye afsnit med en tom linje. Skriv **ord** for en diskret
                fremhævning.
              </small>
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={chapter.isFuture}
                disabled={!chapter.isFuture && chapters.some((c) => c.isFuture)}
                onChange={(e) => updateChapter({ isFuture: e.target.checked })}
              />
              Fremtidskapitel – vises altid til sidst
            </label>
          </fieldset>
          <div className="admin-image-heading">
            <div>
              <h3>
                Billeder <span>{chapter.images.length} / 8</span>
              </h3>
              <p>
                Kun dine egne billeder. Ingen billedpladser vises, hvis du ikke
                tilføjer nogen.
              </p>
            </div>
          </div>
          <div className="admin-images">
            {chapter.images.map((image, index) => (
              <div className="admin-image" key={image.id}>
                <div
                  className={`admin-image-preview crop-${image.crop}`}
                  style={{
                    aspectRatio:
                      image.crop === "auto" || image.crop === "contain"
                        ? `${image.width}/${image.height}`
                        : undefined,
                  }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width:760px) 80vw, 440px"
                    style={{
                      objectFit: image.crop === "contain" ? "contain" : "cover",
                      objectPosition: `${image.focusX}% ${image.focusY}%`,
                    }}
                  />
                </div>
                <fieldset disabled={Boolean(busy)}>
                  <label>
                    Billedbeskrivelse
                    <input
                      value={image.alt}
                      maxLength={400}
                      onChange={(e) =>
                        updateImage(image.id, { alt: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Tekst under billedet
                    <input
                      value={image.caption}
                      maxLength={400}
                      onChange={(e) =>
                        updateImage(image.id, { caption: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Billedformat
                    <select
                      value={image.crop}
                      onChange={(e) =>
                        updateImage(image.id, {
                          crop: e.target.value as TimelineImage["crop"],
                        })
                      }
                    >
                      <option value="auto">Originalt format</option>
                      <option value="portrait">Portræt (3:4)</option>
                      <option value="landscape">Landskab (4:3)</option>
                      <option value="square">Kvadratisk (1:1)</option>
                      <option value="contain">Vis hele billedet</option>
                    </select>
                  </label>
                  <label>
                    Fokus vandret: {image.focusX}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={image.focusX}
                      onChange={(e) =>
                        updateImage(image.id, {
                          focusX: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Fokus lodret: {image.focusY}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={image.focusY}
                      onChange={(e) =>
                        updateImage(image.id, {
                          focusY: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="admin-image-tools">
                    <button
                      type="button"
                      aria-label={`Flyt billede ${index + 1} frem`}
                      disabled={index === 0}
                      onClick={() => moveImage(image.id, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Flyt billede ${index + 1} tilbage`}
                      disabled={index === chapter.images.length - 1}
                      onClick={() => moveImage(image.id, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <label className="admin-file-button">
                      Udskift
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          void upload(e.target.files, image.id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin-remove"
                      onClick={() =>
                        updateChapter({
                          images: chapter.images.filter(
                            (i) => i.id !== image.id,
                          ),
                        })
                      }
                    >
                      <Trash2 size={15} />
                      Fjern
                    </button>
                  </div>
                </fieldset>
              </div>
            ))}
          </div>
          <label
            className={`admin-upload ${busy || chapter.images.length >= 8 ? "is-disabled" : ""}`}
          >
            <ImagePlus size={22} />
            <span>
              Tilføj dine billeder
              <small>JPG, PNG eller WebP · højst 10 MB pr. billede</small>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={Boolean(busy) || chapter.images.length >= 8}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="admin-remove admin-delete-chapter"
            disabled={Boolean(busy) || chapters.length <= 1}
            onClick={() => {
              if (
                !window.confirm(
                  `Vil du fjerne kapitlet “${chapter.title}”? Det sker først på siden, når du gemmer.`,
                )
              )
                return;
              const next = chapters.filter((c) => c.id !== chapter.id);
              change((doc) => ({ ...doc, chapters: next }));
              choose(next[0].id);
            }}
          >
            <Trash2 size={15} />
            Fjern dette kapitel
          </button>
        </div>
      </div>
    </>
  );
}
