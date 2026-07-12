import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Common API key patterns
const PATTERNS = [
  { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9]{20,}/g },
  { name: "Stripe API Key", regex: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{20,}/g },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "AWS Secret Key", regex: /(?<=aws_secret_access_key\s*[=:]\s*)[A-Za-z0-9/+=]{40}/gi },
  { name: "GitHub Token", regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: "Google API Key", regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: "SendGrid Key", regex: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/g },
  { name: "Supabase Key", regex: /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g },
  { name: "Heroku API Key", regex: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g },
  { name: "Generic API Key", regex: /(?<=api[_-]?key\s*[=:]\s*['"]?)[A-Za-z0-9\-_]{20,}/gi },
  { name: "Private Key Block", regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g },
  { name: "Password in Code", regex: /(?<=password\s*[=:]\s*['"])[^'"]{8,}/gi },
  { name: "Bearer Token", regex: /(?<=Bearer\s+)[A-Za-z0-9\-_.]+/g },
  { name: "Connection String", regex: /(?:postgres|mysql|mongodb):\/\/[^\s'"]+/gi },
];

interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: "high" | "medium" | "low";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { files } = await request.json();
    // files: Array<{ name: string, content: string }>

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Files array required" }, { status: 400 });
    }

    const results: ScanResult[] = [];

    for (const file of files) {
      const lines = file.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const pattern of PATTERNS) {
          const matches = lines[i].matchAll(new RegExp(pattern.regex.source, pattern.regex.flags));
          for (const match of matches) {
            const severity = getSeverity(pattern.name, match[0]);
            results.push({
              file: file.name,
              line: i + 1,
              pattern: pattern.name,
              match: maskMatch(match[0]),
              severity,
            });
          }
        }
      }
    }

    const summary = {
      totalFiles: files.length,
      totalFindings: results.length,
      high: results.filter(r => r.severity === "high").length,
      medium: results.filter(r => r.severity === "medium").length,
      low: results.filter(r => r.severity === "low").length,
    };

    return NextResponse.json({ results, summary });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}

function getSeverity(name: string, match: string): "high" | "medium" | "low" {
  if (["Private Key Block", "AWS Secret Key", "Connection String"].includes(name)) return "high";
  if (match.length > 30) return "high";
  if (["Generic API Key", "Password in Code"].includes(name)) return "medium";
  return "low";
}

function maskMatch(match: string): string {
  if (match.length <= 8) return "••••••••";
  return match.slice(0, 4) + "•••" + match.slice(-4);
}
