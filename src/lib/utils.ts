export { cn } from "cn"

export const fetcher = async (url: string | URL, init?: RequestInit): Promise<any> => {
  const res = await fetch(url, init)

  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}))
    const err = new Error(data.error || "Error while getting data from the server.");
    throw err;
  }

  return res.json();
}
