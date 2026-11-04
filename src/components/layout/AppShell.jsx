import { NavLink, Outlet } from "react-router-dom";
import { Radar, ScanLine, Plug } from "lucide-react";

const NAV = [
  { to: "/", label: "Deck", Icon: Radar, end: true },
  { to: "/checks", label: "Check log", Icon: ScanLine, end: false },
  { to: "/setup", label: "Bot setup", Icon: Plug, end: false },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
        <Radar className="h-3.5 w-3.5 text-primary" />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
        Receipt OSINT
      </span>
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(70%_45%_at_50%_-10%,rgba(163,230,53,0.07),transparent_70%)]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col justify-between border-r border-white/[0.06] px-4 py-6 lg:flex">
        <div>
          <div className="px-2">
            <Brand />
          </div>
          <nav className="mt-9 space-y-1">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.06] text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <p className="px-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted-foreground/60">
          NIP reference checks
          <br />
          Onitsha · Nigeria
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-white/[0.06] bg-background/85 px-5 backdrop-blur lg:hidden">
        <Brand />
      </header>

      <main className="px-5 pb-24 pt-8 sm:px-8 lg:pb-16 lg:pl-[264px] lg:pr-10 lg:pt-12">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/[0.06] bg-background/95 backdrop-blur lg:hidden">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}