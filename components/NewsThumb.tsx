// Always occupies the same box (sized via `className`) whether or not the
// article has an image, so rows/cards next to one without an image don't
// have their title/body shift into the space the thumbnail would take.
export function NewsThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`${className} bg-neutral-100 object-contain`} />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`${className} flex items-center justify-center bg-neutral-100 text-neutral-300`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-1/3 w-1/3"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}
