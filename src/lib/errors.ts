// Turns Supabase / Postgres errors into messages a user can act on.
export function friendlyError(error: unknown): string {
  if (!error) return 'Something went wrong.';
  const e = error as { message?: string; code?: string; status?: number };
  const message = e.message ?? String(error);

  if (e.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return "You don't have permission to do that.";
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Network error. Check your connection and try again.';
  }
  if (/Invalid login credentials/i.test(message)) {
    return 'Email or password is incorrect.';
  }
  if (/mime type|invalid_mime_type/i.test(message)) {
    return 'Only JPEG, PNG or WebP images are allowed.';
  }
  if (/exceeded the maximum allowed size|Payload too large/i.test(message) || e.status === 413) {
    return 'That photo is larger than 5 MB.';
  }
  return message;
}
