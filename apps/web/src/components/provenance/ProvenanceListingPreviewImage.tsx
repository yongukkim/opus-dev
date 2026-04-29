type Props = {
  submissionId: string | undefined;
  artworkTitle: string;
  /** Tailwind classes for the outer frame (aspect, rounded, bg). */
  frameClassName: string;
  /** Hint for responsive selection (native `img` `sizes` attribute). */
  sizes: string;
};

/**
 * Watermarked public preview for an open provenance listing when the row
 * carries `sourceSubmissionId` (vault-registered transfer). Same surface as
 * `/api/artwork-submissions/[id]/public-preview` (ISO 27001 A.13.1.3 — derived WebP only).
 *
 * Uses a native `img` (not `next/image`): dynamic same-origin `/api/…` WebP can be
 * skipped or mishandled by the image optimizer in some deploy shapes; the route already
 * returns a small derivative.
 */
export function ProvenanceListingPreviewImage({
  submissionId,
  artworkTitle,
  frameClassName,
  sizes,
}: Props) {
  const trimmed = submissionId?.trim();
  if (!trimmed) {
    return (
      <div className={`overflow-hidden ${frameClassName}`} aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(222,184,146,0.12),transparent_55%)]" />
      </div>
    );
  }

  const src = `/api/artwork-submissions/${encodeURIComponent(trimmed)}/public-preview`;

  return (
    <div className={`relative overflow-hidden ${frameClassName}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic same-origin API WebP; see module comment */}
      <img
        src={src}
        alt={artworkTitle}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-95"
      />
    </div>
  );
}
