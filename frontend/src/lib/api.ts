const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function askCopilot(question: string, accessToken?: string | null, userId?: string | null): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const body: { question: string; user_id?: string } = { question };
  if (userId) body.user_id = userId;
  const res = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.answer;
}
