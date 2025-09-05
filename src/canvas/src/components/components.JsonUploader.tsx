import React, { useRef, useState } from 'react';
import type { Venue, Booking } from '@/types/holidaze';


export interface JsonUploaderResult {
venues: Venue[];
bookings: Booking[];
}


export default function JsonUploader({ onData }: { onData: (data: JsonUploaderResult) => void; }) {
const venuesRef = useRef<HTMLInputElement>(null);
const bookingsRef = useRef<HTMLInputElement>(null);
const bundleRef = useRef<HTMLInputElement>(null);
const [status, setStatus] = useState<string>('');


async function readFile(file: File): Promise<any> {
const text = await file.text();
try { return JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON in ${file.name}`); }
}


function normVenues(raw: any): Venue[] {
const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.venues) ? raw.venues : [];
return arr.filter(Boolean).map((v: any) => ({ id: String(v.id ?? v._id ?? v.slug ?? crypto.randomUUID()), name: String(v.name ?? v.title ?? 'Unnamed'), price: Number(v.price ?? 0), location: v.location ?? v.address ?? {} }));
}
function normBookings(raw: any): Booking[] {
const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.bookings) ? raw.bookings : [];
return arr.filter(Boolean).map((b: any) => ({ id: String(b.id ?? b._id ?? ''), venueId: b.venueId ?? b.venue?.id ?? b.venue_id, venue: b.venue, dateFrom: b.dateFrom ?? b.from ?? b.startDate, dateTo: b.dateTo ?? b.to ?? b.endDate, guests: b.guests, owner: b.owner, remember: b.remember }));
}


async function loadSeparate() {
setStatus('Reading files…');
const venuesFile = venuesRef.current?.files?.[0];
const bookingsFile = bookingsRef.current?.files?.[0];
if (!venuesFile || !bookingsFile) { setStatus('Please choose both files.'); return; }
try {
const [vRaw, bRaw] = await Promise.all([readFile(venuesFile), readFile(bookingsFile)]);
const venues = normVenues(vRaw); const bookings = normBookings(bRaw);
setStatus(`Loaded ${venues.length} venues, ${bookings.length} bookings.`);
onData({ venues, bookings });
} catch (e: any) {
setStatus(e.message || 'Failed reading JSON');
}
}


async function loadBundle() {
setStatus('Reading bundle…');
const file = bundleRef.current?.files?.[0];
if (!file) { setStatus('Please choose a bundle JSON ({ venues:[], bookings:[] }).'); return; }
try {
const raw = await readFile(file);
const venues = normVenues(raw?.venues ?? raw);
const bookings = normBookings(raw?.bookings ?? raw);
setStatus(`Loaded ${venues.length} venues, ${bookings.length} bookings.`);
onData({ venues, bookings });
} catch (e: any) {
setStatus(e.message || 'Failed reading JSON');
}
}


return (
<div className="space-y-3 p-3 border rounded-lg bg-white">
<div className="text-sm font-medium">Load data from JSON</div>
}