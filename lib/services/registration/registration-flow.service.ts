import "server-only";

import { findCitizenSummaryByCedula } from "@/lib/services/registration/citizen-registry.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";

export interface RegistrationWizardState {
  initialStep: 0 | 1 | 2;
  initialName: string;
}

export async function getRegistrationWizardState(): Promise<RegistrationWizardState> {
  const session = await getRegistrationSession();

  if (!session) {
    return {
      initialStep: 0,
      initialName: "",
    };
  }

  try {
    const citizen = await findCitizenSummaryByCedula(session.cedula);

    if (!citizen?.firstName) {
      return {
        initialStep: 0,
        initialName: "",
      };
    }

    return {
      initialStep: 1,
      initialName: citizen.firstName,
    };
  } catch (error) {
    console.error("[registration-flow] Failed to hydrate wizard state:", error);

    return {
      initialStep: 0,
      initialName: "",
    };
  }
}
