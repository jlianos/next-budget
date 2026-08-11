import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/dal";
import { selectWorkspace } from "@/features/workspaces/actions";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { getPreferredWorkspace, getUserWorkspaces } from "@/features/workspaces/queries";

export default async function Home() {
  const user = await requireUser();
  const [memberships, preferredMembership] = await Promise.all([
    getUserWorkspaces(user.id),
    getPreferredWorkspace(user.id),
  ]);

  const selectedWorkspaceId = preferredMembership?.workspace.id ?? null;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-600">Signed in as</p>
            <h1 className="font-medium text-zinc-950">{user.email}</h1>
          </div>

          <form action={signOut}>
            <button
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-950">Your workspaces</h2>

            <p className="text-sm text-zinc-600">Choose where you want to manage your finances.</p>
          </div>

          {memberships.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {memberships.map(({ role, workspace }) => {
                const selectThisWorkspace = selectWorkspace.bind(null, workspace.id);
                const selected = workspace.id === selectedWorkspaceId;

                return (
                  <li key={workspace.id}>
                    <form action={selectThisWorkspace}>
                      <button
                        aria-pressed={selected}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                        type="submit"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-zinc-950">{workspace.name}</h3>

                            <p className="mt-1 text-sm text-zinc-500">{workspace.currency}</p>
                          </div>

                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                            {role.toLowerCase()}
                          </span>
                        </div>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-6 text-center">
              <h3 className="font-medium text-zinc-950">No workspace yet</h3>

              <p className="mt-2 text-sm text-zinc-600">Create a workspace below or join one using its workspace ID.</p>
            </div>
          )}
        </section>
        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-950">Create a workspace</h2>

              <p className="text-sm text-zinc-600">Create a personal or shared place for tracking finances.</p>
            </div>

            <CreateWorkspaceForm />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-950">Join a workspace</h2>

              <p className="text-sm text-zinc-600">Enter the workspace ID shared with you.</p>
            </div>

            <JoinWorkspaceForm />
          </section>
        </div>
      </div>
    </div>
  );
}
