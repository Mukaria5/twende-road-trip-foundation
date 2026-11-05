/** Small form and readout pieces shared by the trip planners. */

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={value}
      placeholder={placeholder ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
    />
  );
}

export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
