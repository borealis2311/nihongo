import { NextRequest, NextResponse } from "next/server";
import { setPendingImage, takePendingImage } from "@/lib/capture-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh trong yêu cầu." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  setPendingImage(id, buffer, file.type || "image/jpeg");

  return NextResponse.json({ ok: true });
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const image = takePendingImage(id);

  if (!image) {
    return NextResponse.json({ ready: false });
  }

  const dataUrl = `data:${image.contentType};base64,${image.buffer.toString("base64")}`;
  return NextResponse.json({ ready: true, image: dataUrl });
}
