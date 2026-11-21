import mongoose from "mongoose";
import dbConnect from "@/app/lib/dbConnect";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const isConnected = mongoose.connection.readyState === 1;
    return Response.json({ ok: isConnected });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}