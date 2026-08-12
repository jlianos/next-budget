import Link from "next/link";

type SettingsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        <p className="mt-2 text-zinc-600">Manage this workspace and its financial configuration.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
          href={`/w/${workspaceId}/settings/wallets`}
        >
          <h2 className="font-semibold text-zinc-950">Wallets</h2>

          <p className="mt-2 text-sm text-zinc-600">Review balances and manage workspace wallets.</p>
        </Link>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 opacity-60 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Transaction categories</h2>

          <p className="mt-2 text-sm text-zinc-600">Coming later.</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 opacity-60 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Members</h2>

          <p className="mt-2 text-sm text-zinc-600">Coming later.</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 opacity-60 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Workspace</h2>

          <p className="mt-2 text-sm text-zinc-600">Coming later.</p>
        </section>
      </div>
    </div>
  );
}
