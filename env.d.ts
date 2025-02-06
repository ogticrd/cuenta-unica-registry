namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production';
    CEDULA_API?: string;
    CEDULA_API_KEY?: string;
    JCE_PHOTO_API?: string;
    JCE_PHOTO_API_KEY?: string;
    ENCRYPTION_KEY?: string;
    RECAPTHA_API_KEY?: string;
    RECAPTHA_PROJECT_ID?: string;
    SITE_COOKIE_KEY?: string;
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY?: string;
    NEXT_PUBLIC_GTM_ID?: string;
    CEDULA_TOKEN_API?: string;
    CITIZENS_API_AUTH_KEY?: string;
    NEXT_PUBLIC_ORY_SDK_URL?: string;
    ORY_SDK_TOKEN?: string;
    LIVENESS_CONFIDENCE_THRESHOLD?: number;
    LIVENESS_SIMILARITY_THRESHOLD?: number;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    SENTRY_ORG?: string;
    SENTRY_PROJECT?: string;
    SENTRY_ENV?: 'development' | 'production';
    BACKOFFICE_API_URL?: string;
    BACKOFFICE_API_KEY?: string;
  }
}
