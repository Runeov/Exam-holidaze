import type { ApiResponse, Venue, Booking } from '@/types/holidaze';


export const NOROFF_BASE_URL = (globalThis as any).NOROFF_BASE_URL || 'https://v2.api.noroff.dev';


/**
* Build query string. Skips undefined/null.
*/
export function qs(params: Record<string, unknown> = {}): string {
const search = new URLSearchParams();
for (const [k, v] of Object.entries(params)) {
if (v === undefined || v === null) continue;
search.set(k, String(v));
}
const s = search.toString();
return s ? `?${s}` : '';
}


/**
* Core fetch wrapper.
*/
export async function noroffFetch<T>(path: string, opts: {
token?: string;
apiKey?: string;
method?: string;
body?: unknown;
params?: Record<string, unknown>;
headers?: Record<string, string>;
} = {}): Promise<ApiResponse<T>> {
const { token, apiKey, method = 'GET', body, params, headers } = opts;
const url = `${NOROFF_BASE_URL}${path}${qs(params)}`;
const res = await fetch(url, {
method,
headers: {
'Content-Type': 'application/json',
...(token ? { Authorization: `Bearer ${token}` } : {}),
...(apiKey ? { 'X-Noroff-API-Key': apiKey } : {}),
...headers,
},
body: body ? JSON.stringify(body) : undefined,
});


const contentType = res.headers.get('content-type') || '';
const isJson = contentType.includes('application/json');
const payload = isJson ? await res.json() : await res.text();
if (!res.ok) {
const error = new Error(`Noroff API ${res.status} ${res.statusText}`);
(error as any).status = res.status; // why: UI decisions
(error as any).payload = payload;
}