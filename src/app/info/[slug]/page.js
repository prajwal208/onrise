import InfoPageClient from "@/component/InfoPageClient/InfoPageClient";


export default async function InfoPage({ params }) {
  const resolvedParams = await params; // unwrap the Promise
  const { slug } = resolvedParams;

  return <InfoPageClient slug={slug} />;
}
