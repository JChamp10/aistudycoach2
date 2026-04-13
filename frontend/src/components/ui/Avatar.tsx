'use client';

import { getAvatarSrc } from '@/lib/avatar';
import { clsx } from 'clsx';

type AvatarProps = {
  username?: string | null;
  avatarUrl?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  textClassName?: string;
};

export default function Avatar({
  username,
  avatarUrl,
  alt,
  className,
  imageClassName,
  fallbackClassName,
  textClassName,
}: AvatarProps) {
  const src = getAvatarSrc(avatarUrl);
  const initial = username?.[0]?.toUpperCase() || '?';

  return (
    <div className={clsx('overflow-hidden flex items-center justify-center', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || `${username || 'User'} avatar`}
          className={clsx('w-full h-full object-cover', imageClassName)}
        />
      ) : (
        <div className={clsx('w-full h-full flex items-center justify-center font-extrabold uppercase', fallbackClassName)}>
          <span className={textClassName}>{initial}</span>
        </div>
      )}
    </div>
  );
}
