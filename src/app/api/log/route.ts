import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

function getLogFilePath(date = new Date()) {
    const d = date.toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(logDir, `${d}.jsonl`);
}

// ---- POST: append new log ----
export async function POST(req: Request) {
    try {
        const data = await req.json();
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
        const file = getLogFilePath();
        fs.appendFileSync(file, JSON.stringify(data) + "\n");
        return NextResponse.json({ status: "ok" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ---- GET: fetch last 10 logs for today ----
export async function GET() {
    try {
        const file = getLogFilePath();
        if (!fs.existsSync(file)) {
            return NextResponse.json([]); // no logs yet
        }

        const content = fs.readFileSync(file, "utf8").trim();
        if (!content) return NextResponse.json([]);

        const records = content
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line));

        // only last 10 logs
        const last10 = records.slice(-10);

        return NextResponse.json(last10);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
