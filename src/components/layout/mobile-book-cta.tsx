import Link from "next/link";

interface MobileBookCtaProps {
  label: string;
}

export function MobileBookCta({ label }: MobileBookCtaProps) {
  return (
    <Link href="/booking" className="btn-primary sticky-book">
      {label}
    </Link>
  );
}
