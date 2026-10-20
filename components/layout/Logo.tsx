'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <div className="absolute top-0 left-0 z-50 p-4">
      <Link href="/inicio" className="block">
        <svg className="w-9 h-9 lg:w-14 lg:h-14" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* L shape with rounded corners - background */}
          <rect
            x="6"
            y="6"
            width="24"
            height="24"
            rx="4"
            fill="#1B5E3B"
          />
          {/* Vertical part of L */}
          <rect
            x="10"
            y="10"
            width="4"
            height="16"
            rx="2"
            fill="#FAF7F2"
          />
          {/* Horizontal part of L */}
          <rect
            x="10"
            y="22"
            width="12"
            height="4"
            rx="2"
            fill="#FAF7F2"
          />
          {/* Arrow pointing up and right in top right corner of L */}
          <path
            d="M22 12L26 8M26 8L22 8M26 8L26 12"
            stroke="#1B5E3B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
}
