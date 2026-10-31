import { CaptureClient } from "@/components/capture-client";

interface CapturePageProps {
  params: Promise<{ id: string }>;
}

export default async function CapturePage({ params }: CapturePageProps) {
  const { id } = await params;
  return <CaptureClient sessionId={id} />;
}
