'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-creme border-b border-creme-2">
      <div className="max-w-md lg:max-w-[720px] mx-auto px-6 py-[18px] flex items-center justify-between">
        <Link href="/inicio" className="flex items-center">
          <Image
            src="/lucrou.webp"
            alt="Lucrou"
            width={120}
            height={40}
            className="h-[34px] lg:h-[38px] w-auto object-contain"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
