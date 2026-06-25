import { ShieldCheck, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { getOAuthConsentRequest } from "@/lib/ory/oauth-consent";
import {
  acceptOAuthConsentRequest,
  getConsentClientLabel,
  getOAuthConsentRequest as loadOAuthConsentRequest,
  rejectOAuthConsentRequest,
} from "@/lib/ory/oauth-consent";

interface ConsentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function redirectToConsentError(description: string): never {
  redirect(
    `/error?error=oauth2_consent_failed&error_description=${encodeURIComponent(description)}`,
  );
}

function getFormValues(formData: FormData, name: string) {
  return formData.getAll(name).map(String).filter(Boolean);
}

async function acceptConsentAction(formData: FormData) {
  "use server";

  const consentChallenge = formData.get("consent_challenge")?.toString();

  if (!consentChallenge) {
    redirectToConsentError("Missing consent challenge.");
  }

  let redirectTo: string;

  try {
    redirectTo = await acceptOAuthConsentRequest(consentChallenge, {
      audience: getFormValues(formData, "audience"),
      scope: getFormValues(formData, "scope"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    redirectToConsentError(message);
  }

  redirect(redirectTo);
}

async function rejectConsentAction(formData: FormData) {
  "use server";

  const consentChallenge = formData.get("consent_challenge")?.toString();

  if (!consentChallenge) {
    redirectToConsentError("Missing consent challenge.");
  }

  let redirectTo: string;

  try {
    redirectTo = await rejectOAuthConsentRequest(consentChallenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    redirectToConsentError(message);
  }

  redirect(redirectTo);
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const consentChallenge = firstParam(params.consent_challenge);

  if (!consentChallenge) {
    redirectToConsentError("Missing consent challenge.");
  }

  let consent: Awaited<ReturnType<typeof getOAuthConsentRequest>>;

  try {
    consent = await loadOAuthConsentRequest(consentChallenge);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    redirectToConsentError(message);
  }

  if (consent.skip) {
    const redirectTo = await acceptOAuthConsentRequest(consentChallenge);
    redirect(redirectTo);
  }

  const requestedScope = consent.requested_scope ?? [];
  const requestedAudience = consent.requested_access_token_audience ?? [];
  const clientLabel = getConsentClientLabel(consent);

  return (
    <main className="flex-1 px-4 py-12">
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Autorizacion de servicio
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Permitir acceso a {clientLabel}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Revisa los permisos solicitados antes de continuar con el acceso.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Cuenta
            </p>
            <p className="mt-2 break-words font-mono text-sm text-foreground">
              {consent.subject ?? "No disponible"}
            </p>
          </div>

          <form action={acceptConsentAction} className="space-y-6">
            <input
              type="hidden"
              name="consent_challenge"
              value={consentChallenge}
            />

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                Permisos
              </legend>
              {requestedScope.length > 0 ? (
                <div className="space-y-2">
                  {requestedScope.map((scope) => (
                    <label
                      className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
                      key={scope}
                    >
                      <input
                        type="checkbox"
                        name="scope"
                        value={scope}
                        defaultChecked
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="font-mono">{scope}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  Este servicio no solicito permisos adicionales.
                </p>
              )}
            </fieldset>

            {requestedAudience.length > 0 ? (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-foreground">
                  Audiencia
                </legend>
                <div className="space-y-2">
                  {requestedAudience.map((audience) => (
                    <label
                      className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
                      key={audience}
                    >
                      <input
                        type="checkbox"
                        name="audience"
                        value={audience}
                        defaultChecked
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="font-mono">{audience}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Button
                formAction={rejectConsentAction}
                type="submit"
                variant="outline"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Cancelar
              </Button>
              <Button type="submit">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Continuar
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
