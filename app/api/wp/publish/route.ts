import { NextResponse } from "next/server";
import { publishPost } from "@/app/actions/post";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const result = await publishPost(formData);
        return NextResponse.json({ success: true, wpPostId: result.wpPostId });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
