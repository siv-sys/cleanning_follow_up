// Minimal declarations for the parts of the Deno runtime the Edge Functions use,
// so the editor's TypeScript understands them. Deno provides the real ones at runtime.

declare namespace Deno {
  const env: {
    get(key: string): string | undefined;
  };
  function serve(handler: (request: Request) => Response | Promise<Response>): unknown;
}

// Deno's `npm:` specifier → the same package from the project's node_modules.
declare module 'npm:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}
