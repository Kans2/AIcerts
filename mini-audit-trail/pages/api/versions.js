import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "versions.json");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const versions = JSON.parse(raw || "[]");
    // return most-recent-first
    const list = versions.slice().reverse();
    return res.status(200).json({ versions: list });
  } catch (e) {
    return res.status(200).json({ versions: [] });
  }
}
