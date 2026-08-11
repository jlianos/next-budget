"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { signOut } from "@/features/auth/actions";

type SelectedWorkspace = {
  id: string;
  name: string;
  currency: string;
  role: string;
};

type AppShellProps = {
  children: ReactNode;
  selectedWorkspace: SelectedWorkspace | null;
  userEmail: string;
};

export function AppShell({ children, selectedWorkspace, userEmail }: AppShellProps) {
  const pathname = usePathname();

  const effectivePathname =
    pathname === "/" ? (selectedWorkspace ? `/w/${selectedWorkspace.id}/overview` : "/workspaces") : pathname;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const navigation = [
    {
      label: "Workspaces",
      href: "/workspaces",
    },
    ...(selectedWorkspace
      ? [
          {
            label: "Overview",
            href: `/w/${selectedWorkspace.id}/overview`,
          },
          {
            label: "Activity",
            href: `/w/${selectedWorkspace.id}/activity`,
          },
          {
            label: "Reports",
            href: `/w/${selectedWorkspace.id}/reports`,
          },
          {
            label: "Recurring",
            href: `/w/${selectedWorkspace.id}/recurring`,
          },
          {
            label: "Settings",
            href: `/w/${selectedWorkspace.id}/settings`,
          },
        ]
      : []),
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      {menuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMenu}
          type="button"
        />
      )}

      <aside
        aria-label="Application navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="application-navigation"
      >
        <div className="border-b border-zinc-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <Link className="text-lg font-semibold" href="/" onClick={closeMenu}>
              Next Budget
            </Link>

            <button
              aria-label="Close menu"
              className="rounded-lg p-2 text-xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 md:hidden"
              onClick={closeMenu}
              type="button"
            >
              ×
            </button>
          </div>

          {selectedWorkspace ? (
            <div className="mt-4">
              <p className="font-medium">{selectedWorkspace.name}</p>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedWorkspace.role.toLowerCase()}
                {" · "}
                {selectedWorkspace.currency}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No workspace selected</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const active = effectivePathname === item.href || effectivePathname.startsWith(`${item.href}/`);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-zinc-100 text-zinc-950" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
                href={item.href}
                key={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <p className="truncate px-3 py-2 text-xs text-zinc-500">{userEmail}</p>

          <form action={signOut}>
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="flex items-center border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <button
            aria-controls="application-navigation"
            aria-expanded={menuOpen}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            Menu
          </button>

          <p className="ml-3 truncate font-medium">{selectedWorkspace?.name ?? "Next Budget"}</p>
        </header>

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
