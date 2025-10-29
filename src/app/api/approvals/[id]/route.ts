import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function PATCH(_: Request, { params }: { params: { id: string } }) {
try {
// This route is optional if you use the server action in the page.
return NextResponse.json({ ok: true });
} catch (e: any) {
return new NextResponse(e.message || "Error", { status: 400 });
}
}