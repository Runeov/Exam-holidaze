import React from "react";


/**
* Decorative starry background wrapper.
* - Image lives in `/public/Stars_big.png` (Next/CRA public dir).
* - Overlay keeps foreground contrast WCAG-compliant.
*/
export function StarryBackground({
children,
className,
}: {
children: React.ReactNode;
className?: string;
}) {
return (
<div className={["relative isolate min-h-screen", className].filter(Boolean).join(" ")}>
{/* Background image layer (decorative) */}
<div
aria-hidden="true"
className="stars-image absolute inset-0 -z-20 bg-[url('/Stars_big.png')] bg-no-repeat bg-cover bg-center pointer-events-none"
/>


{/* Contrast overlay to ensure text legibility across themes */}
<div
aria-hidden="true"
className="stars-overlay absolute inset-0 -z-10 pointer-events-none bg-white/85 dark:bg-black/60"
/>


{children}


{/* Accessibility preferences: increase legibility for high-contrast users */}
<style>{`
@media (prefers-contrast: more) {
.stars-image { opacity: 0.12; }
.stars-overlay { background-color: rgba(255,255,255,0.95); }
:where(.dark) .stars-overlay { background-color: rgba(0,0,0,0.72); }
}
`}</style>
</div>
);
}