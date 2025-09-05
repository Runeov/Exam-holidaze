import React, { useEffect, useMemo, useState } from 'react';
<div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
<div className="font-extrabold tracking-tight">Noroff API Dashboard</div>
</div>
</nav>
);
}


function Summary({ aggregates }: { aggregates: VenueAggregate[]; }){
const totalBookings=aggregates.reduce((s,a)=>s+a.totalBookingsSince2024,0);
const totalRevenue=aggregates.reduce((s,a)=>s+a.totalRevenueSince2024,0);
return (
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
<KPI title="Venues" value={aggregates.length}/>
<KPI title="Bookings (since 2024)" value={totalBookings}/>
<KPI title="Revenue" value={totalRevenue.toLocaleString()}/>
<KPI title="Top Venue" value={aggregates[0]?.venueName||'—'}/>
</div>
);
}
function KPI({ title, value }: { title: string; value: React.ReactNode; }){
return (
<div className="p-4 rounded-2xl border bg-white shadow-sm">
<div className="text-xs text-gray-500">{title}</div>
<div className="text-xl font-semibold">{value}</div>
</div>
);
}


function VenuesTable({ aggregates }: { aggregates: VenueAggregate[]; }){
return (
<div className="overflow-x-auto border rounded-2xl bg-white mt-4">
<table className="min-w-full text-sm">
<thead className="bg-gray-50">
<tr>
<th className="text-left px-3 py-2">Venue</th>
<th className="text-left px-3 py-2">Location</th>
<th className="text-right px-3 py-2">Price/night</th>
<th className="text-right px-3 py-2">Bookings</th>
<th className="text-right px-3 py-2">Revenue</th>
</tr>
</thead>
<tbody>
{aggregates.map(r=> (
<tr key={r.venueId} className="odd:bg-white even:bg-gray-50">
<td className="px-3 py-2 font-medium">{r.venueName}</td>
<td className="px-3 py-2 text-gray-600">{fmtLocation(r.location)}</td>
<td className="px-3 py-2 text-right">{Number(r.price||0).toLocaleString()}</td>
<td className="px-3 py-2 text-right">{r.totalBookingsSince2024}</td>
<td className="px-3 py-2 text-right">{r.totalRevenueSince2024.toLocaleString()}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}
function fmtLocation(loc?: { address?: string; city?: string; country?: string; lat?: number; lon?: number; lng?: number; }){
if(!loc) return '';
const parts = [loc.address, loc.city, loc.country].filter(Boolean);
return parts.join(', ');
}