// /app/api/esp32/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch("http://10.10.148.62/data");
    const data = await res.json();
    return NextResponse.json(data, {
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
    });
}
