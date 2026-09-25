"use client";
import Image from "next/image";
import { useState } from "react";

/** Round avatar with an initial-letter fallback when there is no image or it fails to load. */
export default function Avatar({ src, name = "", size = 32, className = "" }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-creato font-medium text-gray-500 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.42) }}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          width={size * 2}
          height={size * 2}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
