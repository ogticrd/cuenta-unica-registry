import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
