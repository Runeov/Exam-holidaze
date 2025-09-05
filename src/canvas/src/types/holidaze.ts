export interface Location {
address?: string;
city?: string;
country?: string;
lat?: number; // Noroff often uses latitude as `lat`
lng?: number; // Noroff often uses longitude as `lng`
lon?: number; // tolerate `lon`
}


export interface Venue {
id: string;
name: string;
price?: number; // price per night
location?: Location;
}


export interface Booking {
id?: string;
venueId?: string; // common client-side
venue?: { id: string } & Partial<Venue>; // when included via _venue
dateFrom?: string; // ISO
dateTo?: string; // ISO
guests?: number;
// Optional fields for custom datasets; ignored if absent
owner?: boolean;
remember?: boolean;
}


export interface ApiMeta {
isFirstPage?: boolean;
isLastPage?: boolean;
currentPage?: number;
pageCount?: number;
pageSize?: number;
totalCount?: number;
}


export interface ApiResponse<T> {
data: T;
meta?: ApiMeta;
}