"use client";

import { useState } from "react";

type CopyWorkspaceIdButtonProps = {
  workspaceId: string;
};

export function CopyWorkspaceIdButton({ workspaceId }: CopyWorkspaceIdButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copyWorkspaceId() {
    try {
      await navigator.clipboard.writeText(workspaceId);
      setCopied(true);
      setFailed(false);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        onClick={copyWorkspaceId}
        type="button"
      >
        {copied ? "Copied" : "Copy ID"}
      </button>

      <span aria-live="polite" className="sr-only">
        {copied && "Workspace ID copied to clipboard."}
        {failed && "Unable to copy the workspace ID."}
      </span>
    </div>
  );
}
