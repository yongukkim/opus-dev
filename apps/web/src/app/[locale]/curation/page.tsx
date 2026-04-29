import { notFound } from "next/navigation";
type Props = { params: Promise<{ locale: string }> };

export default async function CurationIndexPage({ params }: Props) {
  void params;
  notFound();
}
