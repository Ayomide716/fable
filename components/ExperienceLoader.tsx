'use client';

import dynamic from 'next/dynamic';

// The 3D layer is client-only and loads after the HTML, so text and the CTA paint first.
const Experience = dynamic(() => import('./Experience'), { ssr: false });

export default function ExperienceLoader() {
  return <Experience />;
}
