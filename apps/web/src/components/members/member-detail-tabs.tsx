'use client';

import { useState, type ReactElement } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactElement;
}

export function MemberDetailTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} className={active === tab.id ? 'space-y-6' : 'hidden'}>
          {/* Cast puntual: dos instancias de @types/react (18 para mobile, 19
              para web) en el mismo monorepo pnpm hacen que TS trate a
              ReactElement como incompatible con ReactNode aunque en runtime
              sea exactamente el mismo JSX — ver docs/TROUBLESHOOTING_MOBILE_PNPM_EXPO.md */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {tab.content as any}
        </div>
      ))}
    </div>
  );
}
