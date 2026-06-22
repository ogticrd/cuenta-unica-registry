import "server-only";

import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { getRegistrationAccountDraft } from "@/lib/services/registration/registration-account-draft.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type { RegistrationSessionStatus } from "@/lib/types/registration/session";
import { normalizeCedula } from "@/lib/utils/cedula";

export interface RegistrationWizardState {
  initialStep: 0 | 1 | 2;
  initialCedula: string;
  initialName: string;
  initialSessionStatus: RegistrationSessionStatus | null;
  hasAccountDraft: boolean;
}

export async function getRegistrationWizardState(): Promise<RegistrationWizardState> {
  const session = await getRegistrationSession();

  if (!session) {
    return {
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    };
  }

  try {
    const citizen = await findCitizenSummaryByCedula(session.cedula);

    if (!citizen?.firstName) {
      return {
        initialStep: 0,
        initialCedula: "",
        initialName: "",
        initialSessionStatus: null,
        hasAccountDraft: false,
      };
    }

    const draft = await getRegistrationAccountDraft();
    const hasAccountDraft =
      Boolean(draft) &&
      normalizeCedula(draft?.cedula ?? "") === normalizeCedula(session.cedula);

    return {
      initialStep: session.status === "verified" && hasAccountDraft ? 2 : 1,
      initialCedula: session.cedula,
      initialName: citizen.firstName,
      initialSessionStatus: session.status,
      hasAccountDraft,
    };
  } catch (error) {
    console.error("[registration-flow] Failed to hydrate wizard state:", error);

    return {
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    };
  }
}
