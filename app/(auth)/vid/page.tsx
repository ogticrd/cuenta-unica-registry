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
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
      {session ? (
        <VidVerification
          key={session.id}
          flowId={session.id}
          firstName={session.firstName}
        />
      ) : (
        <VidVerification
          error={launchError ?? (flow ? "flow_expired" : "invalid_parameters")}
        />
      )}
    </div>
  );
}
