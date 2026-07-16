/** Shared scaffolding for the auth screens: optional top progress bar and the
    centred two-tone heading from the designs. */
export function AuthProgress({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="mx-auto mt-8 h-1.5 w-full max-w-xl rounded-full bg-section">
      <div
        className="h-1.5 rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, (step / total) * 100)}%` }}
      />
    </div>
  );
}

export function AuthHeading({
  line1,
  line2,
  subtitle,
}: {
  line1: string;
  line2?: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-ink">{line1}</h1>
      {line2 && <p className="mt-1 text-4xl font-medium tracking-tight text-faint">{line2}</p>}
      {subtitle && <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-body">{subtitle}</p>}
    </div>
  );
}

export function AuthBody({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-md flex-col px-4 pt-24 pb-16">{children}</div>;
}
