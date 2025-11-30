import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { diffWords } from "../../utils/diff.js";

const DATA_PATH = path.join(process.cwd(), "data", "versions.json");

async function readVersions() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    // if file doesn't exist, create it
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(DATA_PATH, "[]", "utf-8");
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { content } = req.body ?? {};
  if (typeof content !== "string") {
    return res.status(400).json({ error: "Request body must contain 'content' string" });
  }

  const versions = await readVersions();
  const last = versions.length ? versions[versions.length - 1] : null;
  const oldText = last?.content ?? "";

  // running diff algorithm
  const { addedWords, removedWords, oldWordCount, newWordCount } = diffWords(oldText, content);


const now = new Date();
const formattedTimestamp =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(now.getDate()).padStart(2, "0") +
  " " +
  String(now.getHours()).padStart(2, "0") +
  ":" +
  String(now.getMinutes()).padStart(2, "0");



  const newVersion = {
    id: uuidv4(),
    timestamp: formattedTimestamp,
    addedWords,
    removedWords,
    oldLength: oldText.length,
    newLength: content.length,
     oldWordCount,
  newWordCount,
    content // storing full content to allow next diffs against it
  };

  versions.push(newVersion);
  await fs.writeFile(DATA_PATH, JSON.stringify(versions, null, 2), "utf-8");

  return res.status(201).json({ success: true, version: newVersion });
}
