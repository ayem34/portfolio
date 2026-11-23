import type { ReactNode } from 'react';

import type { Cadre } from '../../lib/types';

/** Cadre d'une visite guidée : navigateur, téléphone ou aucun. */
export function DeviceFrame({ cadre, children }: { cadre: Cadre; children: ReactNode }) {
  if (cadre === 'telephone') {
    return (
      <div className="border-border bg-surface-2 mx-auto w-full max-w-[340px] rounded-[2.2rem] border-4 p-2.5 shadow-2xl">
        <div className="bg-border mx-auto mb-2 h-1.5 w-16 rounded-full" aria-hidden="true" />
        <div className="overflow-hidden rounded-[1.5rem] bg-black">{children}</div>
      </div>
    );
  }
  if (cadre === 'navigateur') {
    return (
      <div className="border-border bg-surface-2 overflow-hidden rounded-xl border shadow-2xl">
        <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden="true">
          <span className="bg-danger/70 size-2.5 rounded-full" />
          <span className="bg-warning/70 size-2.5 rounded-full" />
          <span className="bg-success/70 size-2.5 rounded-full" />
          <span className="bg-bg/60 ml-3 h-4 flex-1 rounded-full" />
        </div>
        <div className="bg-black">{children}</div>
      </div>
    );
  }
  return <div className="border-border overflow-hidden rounded-xl border">{children}</div>;
}
