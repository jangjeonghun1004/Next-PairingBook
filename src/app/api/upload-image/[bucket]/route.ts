// src/app/api/upload-image/[bucket]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
): Promise<NextResponse> {
  // params is a Promise—await it to get your bucket name
  const { bucket } = await params;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = `${fileName}`;

  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl }, { status: 200 });
}
