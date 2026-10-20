'use client';

import { useI18n } from '@/lib/i18n/context';

export default function BenefitCards() {
  const { t } = useI18n();

  const benefits = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      text: t('benefits.noSignup'),
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: t('benefits.seconds60'),
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      text: t('benefits.freeStart'),
    },
  ];

  return (
    <div className="max-w-md lg:max-w-2xl lg:px-8 mx-auto px-6 py-6 pb-4">
      <div className="grid grid-cols-3 gap-3 mb-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-creme rounded-xl p-5 flex flex-col items-center gap-3">
            <div className="text-verde">{benefit.icon}</div>
            <p className="text-[12px] text-texto text-center leading-tight font-medium">{benefit.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
