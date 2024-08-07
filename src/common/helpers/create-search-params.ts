export function createSearchParams(params: Record<string, string>) {
  const query = new URLSearchParams();

  for (const key in params) {
    if (params[key]) {
      query.set(key, params[key]);
    }
  }

  return query.toString();
}
