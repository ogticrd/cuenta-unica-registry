import { getMessages, getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

/**
 * Async Server Component — runs on the server.
 * Reads the active locale + message bundle and injects them
 * into NextIntlClientProvider so all Client Components can call useT().
 */
export async function ServerProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
