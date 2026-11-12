import { createClient } from "@supabase/supabase-js";

function createDatabase() {
const url = import.meta.env.VITE_DATABASE_URL;
const key = import.meta.env.VITE_DATABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Set VITE_DATABASE_URL and VITE_DATABASE_PUBLISHABLE_KEY before building.");
return createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    if (key.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } },
});

}
let client: ReturnType<typeof createDatabase> | undefined;
export const database = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_, property, receiver) {
    client ??= createDatabase();
    return Reflect.get(client, property, receiver);
  },
});
