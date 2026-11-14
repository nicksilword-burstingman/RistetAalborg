import { AdminLogin } from "@/components/admin-login";
import { TimelineEditor } from "@/components/timeline-editor";
import { adminPasswordHash, getAdminSession } from "@/lib/server/admin";
import { timelineRepository } from "@/lib/server/timeline";
import "./admin.css";
import Link from "next/link";

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
        <>
          <nav className="admin-commerce-nav" aria-label="Administration">
            <Link className="button dark" href="/admin/handel">
              Ordrer, fragt & betaling →
            </Link>
          </nav>
          <TimelineEditor initialDocument={timelineRepository().read()} />
        </>
      ) : (
        <AdminLogin configured={Boolean(adminPasswordHash())} />
      )}
    </section>
  );
}
