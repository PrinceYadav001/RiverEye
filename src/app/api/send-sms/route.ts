// app/api/send-sms/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { phone, message } = await req.json();
        if (!phone || !message) {
            return NextResponse.json({ error: "Missing phone or message" }, { status: 400 });
        }

        const params = new URLSearchParams({
            message,
            route: "q",                // Quick Transactional
            numbers: String(phone),
            language: "english",
            flash: "0",
            sender_id: process.env.FAST2SMS_SENDER_ID || "YourApprovedSenderID"
        });

        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
            method: "POST",
            headers: {
                authorization: process.env.FAST2SMS_API_KEY || "",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
