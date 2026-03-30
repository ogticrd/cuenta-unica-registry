import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";

// ============================================
// Mock useT Hook Implementation
// ============================================

// Translation dictionary type
type TranslationKey = string;
type TranslationValue = string | ((params: Record<string, string>) => string);
type Translations = Record<TranslationKey, TranslationValue>;

// Simple translation context for testing
const TranslationContext = React.createContext<{
  translations: Translations;
  locale: string;
}>({
  translations: {},
  locale: "es",
});

// useT hook implementation
function useT() {
  const context = React.useContext(TranslationContext);

  const t = (
    key: string,
    params?: Record<string, string | number>
  ): string => {
    const value = context.translations[key];

    if (value === undefined) {
      console.warn(`[i18n] Missing translation for key: ${key}`);
      return key;
    }

    if (typeof value === "function") {
      return value((params as Record<string, string>) || {});
    }

    if (params) {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`{{${k}}}`, "g"), String(v));
      }, value);
    }

    return value;
  };

  const locale = context.locale;
  const isRTL = ["ar", "he", "fa"].includes(locale);

  return { t, locale, isRTL };
}

// Provider component for testing
function TranslationProvider({
  children,
  translations,
  locale = "es",
}: {
  children: React.ReactNode;
  translations: Translations;
  locale?: string;
}) {
  return (
    <TranslationContext.Provider value={{ translations, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

// ============================================
// Test Translations
// ============================================

const testTranslations: Translations = {
  // Common
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.submit": "Enviar",
  "common.back": "Atrás",
  "common.error": "Error",
  "common.success": "Éxito",
  "common.loading": "Cargando...",

  // Authentication
  "auth.login.title": "Iniciar Sesión",
  "auth.login.subtitle": "Ingresa tus credenciales",
  "auth.login.email": "Correo electrónico",
  "auth.login.password": "Contraseña",
  "auth.login.remember_me": "Recordarme",
  "auth.login.forgot_password": "¿Olvidaste tu contraseña?",
  "auth.login.submit": "Iniciar Sesión",
  "auth.login.register": "¿No tienes cuenta? Regístrate",

  "auth.register.title": "Crear Cuenta",
  "auth.register.subtitle": "Completa el formulario de registro",

  "auth.errors.invalid_credentials": "Credenciales inválidas",
  "auth.errors.email_required": "El correo es requerido",
  "auth.errors.password_required": "La contraseña es requerida",
  "auth.errors.password_weak": "La contraseña es muy débil",

  // Steps
  "steps.identification.title": "Identificación",
  "steps.identification.description": "Ingresa tu cédula",
  "steps.account.title": "Cuenta",
  "steps.account.description": "Crea tu cuenta",
  "steps.verification.title": "Verificación",
  "steps.verification.description": "Verifica tu correo",

  // Dynamic translations with parameters
  "greeting.name": "Hola, {{name}}!",
  "errors.field_required": "El campo {{field}} es requerido",
  "errors.min_length": "{{field}} debe tener al menos {{min}} caracteres",
  "errors.max_length": "{{field}} no puede tener más de {{max}} caracteres",
  "pagination.showing": "Mostrando {{start}} - {{end}} de {{total}} resultados",

  // Pluralization helper (function-based)
  "items.count": (params: Record<string, string>) => {
    const count = parseInt(params.count, 10);
    if (count === 1) return `Tienes ${count} elemento`;
    return `Tienes ${count} elementos`;
  },

  "messages.welcome_back": "¡Bienvenido de vuelta, {{name}}! Tu última visita fue el {{lastLogin}}.",
};

// ============================================
// Tests
// ============================================

describe("useT Hook", () => {
  describe("Basic Translation", () => {
    it("should return correct translation for existing key", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("common.save")).toBe("Guardar");
      expect(result.current.t("common.cancel")).toBe("Cancelar");
    });

    it("should return key for missing translation", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("missing.key")).toBe("missing.key");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[i18n] Missing translation for key: missing.key"
      );

      consoleWarnSpy.mockRestore();
    });

    it("should return key for empty translations", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={{}}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("any.key")).toBe("any.key");
    });
  });

  describe("Parameter Interpolation", () => {
    it("should interpolate single parameter", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("greeting.name", { name: "Carlos" })).toBe(
        "Hola, Carlos!"
      );
    });

    it("should interpolate multiple parameters", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(
        result.current.t("errors.min_length", { field: "Contraseña", min: "10" })
      ).toBe("Contraseña debe tener al menos 10 caracteres");
    });

    it("should interpolate parameters with numbers", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(
        result.current.t("pagination.showing", {
          start: 1,
          end: 10,
          total: 100,
        })
      ).toBe("Mostrando 1 - 10 de 100 resultados");
    });

    it("should handle complex interpolation", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(
        result.current.t("messages.welcome_back", {
          name: "Juan",
          lastLogin: "15 de enero",
        })
      ).toBe("¡Bienvenido de vuelta, Juan! Tu última visita fue el 15 de enero.");
    });

    it("should return original string if parameter not provided", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      // Missing parameter should keep the placeholder
      expect(result.current.t("greeting.name")).toBe("Hola, {{name}}!");
    });
  });

  describe("Function-based Translations", () => {
    it("should handle function-based translation", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("items.count", { count: "1" })).toBe(
        "Tienes 1 elemento"
      );
      expect(result.current.t("items.count", { count: "5" })).toBe(
        "Tienes 5 elementos"
      );
    });
  });

  describe("Locale Support", () => {
    it("should return current locale", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations} locale="en">
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.locale).toBe("en");
    });

    it("should default to Spanish locale", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.locale).toBe("es");
    });

    it("should detect RTL languages", () => {
      const { result: arResult } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations} locale="ar">
            {children}
          </TranslationProvider>
        ),
      });

      expect(arResult.current.isRTL).toBe(true);

      const { result: esResult } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations} locale="es">
            {children}
          </TranslationProvider>
        ),
      });

      expect(esResult.current.isRTL).toBe(false);
    });
  });

  describe("Authentication Translations", () => {
    it("should provide login page translations", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("auth.login.title")).toBe("Iniciar Sesión");
      expect(result.current.t("auth.login.email")).toBe("Correo electrónico");
      expect(result.current.t("auth.login.password")).toBe("Contraseña");
    });

    it("should provide registration page translations", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("auth.register.title")).toBe("Crear Cuenta");
    });

    it("should provide error translations with interpolation", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("auth.errors.invalid_credentials")).toBe(
        "Credenciales inválidas"
      );

      expect(
        result.current.t("errors.field_required", { field: "Correo" })
      ).toBe("El campo Correo es requerido");
    });
  });

  describe("Step Translations", () => {
    it("should provide step titles", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("steps.identification.title")).toBe(
        "Identificación"
      );
      expect(result.current.t("steps.account.title")).toBe("Cuenta");
      expect(result.current.t("steps.verification.title")).toBe("Verificación");
    });

    it("should provide step descriptions", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("steps.identification.description")).toBe(
        "Ingresa tu cédula"
      );
      expect(result.current.t("steps.account.description")).toBe(
        "Crea tu cuenta"
      );
    });
  });

  describe("Hook Stability", () => {
    it("should return stable t function reference", () => {
      const { result, rerender } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      const firstT = result.current.t;
      rerender();
      const secondT = result.current.t;

      // t function should be stable (same reference)
      expect(firstT).toBe(secondT);
    });

    it("should update when locale changes", () => {
      const { result, rerender } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations} locale="es">
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.locale).toBe("es");

      rerender(
        <TranslationProvider translations={testTranslations} locale="en">
          <div />
        </TranslationProvider>
      );

      expect(result.current.locale).toBe("en");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string key", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("")).toBe("");
    });

    it("should handle special characters in parameters", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(
        result.current.t("greeting.name", { name: "José María" })
      ).toBe("Hola, José María!");
    });

    it("should handle undefined parameters gracefully", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("common.save", undefined)).toBe("Guardar");
    });

    it("should handle null values in parameters", () => {
      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={testTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("greeting.name", { name: null as unknown as string })).toBe(
        "Hola, null!"
      );
    });

    it("should handle deeply nested translation keys", () => {
      const nestedTranslations: Translations = {
        "deeply.nested.translation.key": "Nested Value",
      };

      const { result } = renderHook(() => useT(), {
        wrapper: ({ children }) => (
          <TranslationProvider translations={nestedTranslations}>
            {children}
          </TranslationProvider>
        ),
      });

      expect(result.current.t("deeply.nested.translation.key")).toBe(
        "Nested Value"
      );
    });
  });
});

describe("useT Hook with Real-world Scenarios", () => {
  it("should work with form validation messages", () => {
    const formTranslations: Translations = {
      "validation.required": "{{field}} es requerido",
      "validation.email.invalid": "El correo electrónico no es válido",
      "validation.password.min": "La contraseña debe tener al menos {{min}} caracteres",
      "validation.password.uppercase": "La contraseña debe contener al menos una mayúscula",
      "validation.password.lowercase": "La contraseña debe contener al menos una minúscula",
      "validation.password.number": "La contraseña debe contener al menos un número",
      "validation.password.special": "La contraseña debe contener al menos un carácter especial",
      "validation.cedula.invalid": "La cédula no es válida",
    };

    const { result } = renderHook(() => useT(), {
      wrapper: ({ children }) => (
        <TranslationProvider translations={formTranslations}>
          {children}
        </TranslationProvider>
      ),
    });

    const { t } = result.current;

    expect(t("validation.required", { field: "Nombre" })).toBe(
      "Nombre es requerido"
    );
    expect(t("validation.password.min", { min: "10" })).toBe(
      "La contraseña debe tener al menos 10 caracteres"
    );
  });

  it("should support dynamic step wizard", () => {
    const wizardTranslations: Translations = {
      "wizard.step.current": "Paso {{current}} de {{total}}",
      "wizard.step.0.title": "Identificación",
      "wizard.step.1.title": "Cuenta",
      "wizard.step.2.title": "Verificación",
      "wizard.progress": "Progreso: {{percent}}%",
    };

    const { result } = renderHook(() => useT(), {
      wrapper: ({ children }) => (
        <TranslationProvider translations={wizardTranslations}>
          {children}
        </TranslationProvider>
      ),
    });

    const { t } = result.current;

    // Dynamic key construction
    expect(t("wizard.step.0.title")).toBe("Identificación");
    expect(t("wizard.step.current", { current: 1, total: 3 })).toBe(
      "Paso 1 de 3"
    );
    expect(t("wizard.progress", { percent: 33 })).toBe("Progreso: 33%");
  });
});