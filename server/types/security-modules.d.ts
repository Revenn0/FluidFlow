// Type declarations for optional security modules
// These modules are not installed but the middleware is prepared for future use

declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';

  interface Options {
    windowMs?: number;
    max?: number;
    message?: object | string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
  }

  export default function rateLimit(options?: Options): RequestHandler;
}

declare module 'helmet' {
  import { RequestHandler } from 'express';

  interface HelmetOptions {
    contentSecurityPolicy?: {
      directives?: Record<string, string[]>;
    } | false;
    crossOriginEmbedderPolicy?: boolean;
  }

  export default function helmet(options?: HelmetOptions): RequestHandler;
}
