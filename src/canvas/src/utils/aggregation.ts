import type { Venue, Booking } from '@/types/holidaze';


export function diffNights(dateFrom: string | Date, dateTo: string | Date): number {
const start = new Date(dateFrom);
const end = new Date(dateTo);
const ms = end.getTime() - start.getTime();
if (!Number.isFinite(ms) || ms <= 0) return 0;
return Math.ceil(ms / (1000 * 60 * 60 * 24));
}


export interface AggregateOptions {
sinceISO?: string; // default: '2024-01-01'
// Optional filters for custom datasets. Ignored for Noroff unless fields exist.
excludeOwnerTrue?: boolean;
requireRememberFalse?: boolean;
}


export interface VenueAggregate {
venueId: string;
venueName: string;
price?: number;
location?: Venue['location'];
totalBookingsSince2024: number;
totalRevenueSince2024: number;
}


/**
* Revenue = venue.price (per night) * nights(dateFrom..dateTo)
*/
export function aggregateHolidaze({ venues, bookings, options = {} }: { venues: Venue[]; bookings: Booking[]; options?: AggregateOptions; }): VenueAggregate[] {
const { sinceISO = '2024-01-01', excludeOwnerTrue = false, requireRememberFalse = false } = options;
const since = new Date(`${sinceISO}T00:00:00Z`);
const vMap = new Map<string, Venue>(venues.map(v => [v.id, v]));
const agg = new Map<string, VenueAggregate>(venues.map(v => [v.id, {
venueId: v.id,
venueName: v.name,
price: v.price,
location: v.location,
totalBookingsSince2024: 0,
totalRevenueSince2024: 0,
}]));


for (const b of bookings) {
if (excludeOwnerTrue && (b as any).owner === true) continue;
if (requireRememberFalse && (b as any).remember !== false) continue;


const venueId = b.venue?.id || b.venueId;
if (!venueId) continue;
const v = vMap.get(venueId);
if (!v) continue;


if (!b.dateFrom || !b.dateTo) continue;
const from = new Date(b.dateFrom);
const to = new Date(b.dateTo);
if (!(from instanceof Date) || !(to instanceof Date) || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) continue;
}