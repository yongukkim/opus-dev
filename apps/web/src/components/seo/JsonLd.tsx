/**
 * Renders a single JSON-LD payload for schema.org (PR-21). Server-only
 * child of a page or layout — never pass unsanitized user content without
 * a dedicated review pass; callers in this app only wire catalog /
 * operator / listing fields already shown on the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
