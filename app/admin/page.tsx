import type { Metadata } from "next";
import { isServerAdminAuthenticated } from "@/lib/admin-auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Admin — BLACKO STORES",
  description: "Private operations dashboard for Blacko Stores studio in Lagos, Nigeria.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  return <AdminDashboard initialAuthenticated={isAuthenticated} />;
}
