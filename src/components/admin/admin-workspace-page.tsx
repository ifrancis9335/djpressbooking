import type { ReactNode } from "react";

interface AdminWorkspacePageProps {
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminWorkspacePage({ kicker, title, description, actions, children }: AdminWorkspacePageProps) {
  return (
    <div className="grid min-w-0 gap-5 pb-2">
      <section className="glass-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-kicker">{kicker}</p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}
