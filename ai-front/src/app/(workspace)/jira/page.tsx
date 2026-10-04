export default function JiraPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
        J
      </span>
      <h1 className="mt-4 text-lg font-semibold text-ink-900">Connect Jira</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        Link your Jira workspace to see tickets, sprints and status changes
        right here.
      </p>
    </div>
  );
}
