"use client";

import { useState } from "react";
import { providerLogo } from "@/lib/logos";

/** A brand logo that falls back to an emoji glyph if the image is missing. */
export function ProviderLogo({
  code,
  fallback,
  className,
}: {
  code: string;
  fallback: string;
  className?: string;
}) {
  const src = providerLogo(code);
  const [err, setErr] = useState(false);

  if (!src || err) {
    return <span className={className}>{fallback}</span>;
  }
  return (
    <img
      src={src}
      alt={code}
      className={`${className ?? ""} object-contain`}
      onError={() => setErr(true)}
    />
  );
}
