import { AdminLogin } from "@/components/admin-login";
import { TimelineEditor } from "@/components/timeline-editor";
import { adminPasswordHash, getAdminSession } from "@/lib/server/admin";
import { timelineRepository } from "@/lib/server/timeline";
import "./admin.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getAdminSession();
  return (
    <section className="admin-shell">
      {session ? (
        <TimelineEditor initialDocument={timelineRepository().read()} />
      ) : (
        <AdminLogin configured={Boolean(adminPasswordHash())} />
      )}
    </section>
  );
}
