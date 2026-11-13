import { z } from "zod";

export const timelineImageSchema = z.object({
  id: z.string().uuid(),
  src: z
    .string()
    .regex(/^\/(?:images\/timeline\/[a-z0-9-]+\.webp|media\/[a-f0-9-]{36})$/),
  alt: z.string().trim().min(1).max(400),
  caption: z.string().trim().max(400),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  focusX: z.number().min(0).max(100),
  focusY: z.number().min(0).max(100),
  crop: z.enum(["auto", "portrait", "landscape", "square", "contain"]),
  sortOrder: z.number().int().min(0).max(10000),
});

export const timelineChapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/),
  period: z.string().trim().min(1).max(100),
  dateTime: z
    .string()
    .regex(/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/)
    .or(z.literal("")),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(10000),
  sortOrder: z.number().int().min(0).max(10000),
  isFuture: z.boolean(),
  images: z.array(timelineImageSchema).max(8),
});

export const timelineDocumentSchema = z
  .object({
    revision: z.number().int().min(1),
    chapters: z.array(timelineChapterSchema).min(1).max(100),
  })
  .superRefine(({ chapters }, ctx) => {
    if (new Set(chapters.map((c) => c.id)).size !== chapters.length) {
      ctx.addIssue({
        code: "custom",
        message: "Kapitlernes ID skal være forskellige.",
      });
    }
    const images = chapters.flatMap((c) => c.images);
    if (new Set(images.map((i) => i.id)).size !== images.length) {
      ctx.addIssue({
        code: "custom",
        message: "Billedernes ID skal være forskellige.",
      });
    }
    if (chapters.filter((c) => c.isFuture).length > 1) {
      ctx.addIssue({
        code: "custom",
        message: "Der må kun være ét fremtidskapitel.",
      });
    }
  });
