'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  textClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'User',
  size = 36,
  className = '',
  textClassName = 'font-black text-xs text-[#F37021]',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Compute initials: up to 2 letters (e.g. Tan Bee Chian -> TB, Johan -> J)
  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const shouldRenderImage = Boolean(src && !hasError);

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-orange-100 flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {shouldRenderImage && src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized={src.startsWith('data:')}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </div>
  );
};
