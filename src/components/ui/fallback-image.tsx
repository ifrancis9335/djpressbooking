"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

type FallbackImageProps = Omit<ImageProps, "src"> & {
  src?: string;
  fallbackSrc: string;
};

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function FallbackImage({ src, fallbackSrc, alt, unoptimized, onError, ...props }: FallbackImageProps) {
  const normalizedSrc = src || fallbackSrc;
  const [activeSrc, setActiveSrc] = useState(normalizedSrc);

  useEffect(() => {
    setActiveSrc(normalizedSrc);
  }, [normalizedSrc]);

  return (
    <Image
      {...props}
      src={activeSrc}
      alt={alt}
      unoptimized={unoptimized || activeSrc.startsWith("blob:") || isExternalUrl(activeSrc)}
      onError={(event) => {
        if (activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}