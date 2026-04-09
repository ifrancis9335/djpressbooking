export async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error((payload as { message?: string }).message ?? "Request failed");
  }
  return payload;
}
