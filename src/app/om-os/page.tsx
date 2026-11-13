import { StoryTimeline } from "@/components/story-timeline";
import { timelineRepository } from "@/lib/server/timeline";
import "./journey.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Vores rejse – mennesket bag Ristet Aalborg",
  description:
    "Fra en solorejse i Asien og medicinstudiet til et lille kafferisteri i Aalborg. Følg den personlige rejse mod friskristet specialkaffe til en fair pris.",
};
export default function Page() {
  const { chapters } = timelineRepository().read();
  return <StoryTimeline chapters={chapters} />;
}
