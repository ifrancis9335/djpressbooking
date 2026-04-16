interface BookingReviewStepProps {
  eventDate: string;
}

export function BookingReviewStep({ eventDate }: BookingReviewStepProps) {
  return (
    <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">
      <p className="font-semibold text-white">Ready to submit inquiry for {eventDate}.</p>
      <p className="mt-1 text-slate-300">We will confirm availability and next steps after submission.</p>
    </div>
  );
}
