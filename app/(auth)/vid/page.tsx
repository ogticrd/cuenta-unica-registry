import type { Metadata } from "next";
import { VidVerification } from "@/components/auth/vid/vid-verification";
import { getVidSession } from "@/lib/services/vid/vid-session.service";
import type { VidLaunchErrorCode } from "@/lib/types/vid";

export const metadata: Metadata = {
  title: "Cuenta Única | VID",
  robots: { index: false, follow: false },
};

const launchErrors: readonly VidLaunchErrorCode[] = [
  "invalid_parameters",
  "invalid_token",
  "invalid_client",
  "invalid_redirect_uri",
  "citizen_not_found",
  "service_unavailable",
];

export default async function VidPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { flow, error } = await searchParams;
  const session = typeof flow === "string" ? await getVidSession(flow) : null;
  const launchError = launchErrors.find((code) => code === error);

  return (
    <main className="flex-1 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {session ? (
          <VidVerification
            key={session.id}
            flowId={session.id}
            firstName={session.firstName}
          />
        ) : (
          <VidVerification
            error={
              launchError ?? (flow ? "flow_expired" : "invalid_parameters")
            }
          />
        )}
      </div>
    </main>
  );
}
