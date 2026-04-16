import { Metadata } from "next";
import { FindBookingForm } from "../../components/forms/find-booking-form";

export const metadata: Metadata = {
  title: "Find My Booking",
  description: "Securely recover access to your DJ Press booking conversation and history."
};

export default function FindBookingPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <FindBookingForm />
      </div>
    </main>
  );
}
