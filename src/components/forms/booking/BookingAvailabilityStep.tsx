interface BookingAvailabilityStepProps {
  selectedIso: string;
  availabilityChecking: boolean;
  dateStatus: { status: "available" | "blocked"; note?: string } | null;
}

export function BookingAvailabilityStep({ selectedIso, availabilityChecking, dateStatus }: BookingAvailabilityStepProps) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4">
      <p className="text-sm text-slate-300">Checking availability for:</p>
      <p className="mt-1 text-lg font-bold text-white">{selectedIso}</p>
      {availabilityChecking ? <p className="mt-2 text-sm text-slate-300">Checking now...</p> : null}
      {!availabilityChecking && dateStatus?.status === "available" ? (
        <p className="status-ok mt-3">Date is available.</p>
      ) : null}
      {!availabilityChecking && dateStatus && dateStatus.status !== "available" ? (
        <p className="status-bad mt-3">Date not available{dateStatus.note ? `: ${dateStatus.note}` : ""}</p>
      ) : null}
    </div>
  );
}
