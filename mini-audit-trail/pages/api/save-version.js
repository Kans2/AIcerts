import { v4 as uuidv4 } from "uuid";
import { diffWords } from "../../utils/diff.js";

// 1. DEFINE AND EXPORT THE IN-MEMORY ARRAY FOR USE BY GET HANDLER
export const versions = [];

// Function to get the last version from the shared array
function getLastVersion() {
    return versions.length ? versions[versions.length - 1] : null;
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

    const last = getLastVersion();
    const oldText = last?.content ?? "";

    // running diff algorithm
    const { addedWords, removedWords, oldWordCount, newWordCount } = diffWords(oldText, content);

    // ... (Timestamp formatting logic remains the same) ...
    const now = new Date();
    const formattedTimestamp =
        now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " + String(now.getHours()).padStart(2, "0") +
        ":" + String(now.getMinutes()).padStart(2, "0");

    const newVersion = {
        id: uuidv4(),
        timestamp: formattedTimestamp,
        addedWords,
        removedWords,
        oldLength: oldText.length,
        newLength: content.length,
        oldWordCount,
        newWordCount,
        content 
    };

    // 2. APPEND to the in-memory array
    versions.push(newVersion);
    
   
    return res.status(201).json({ success: true, version: newVersion });
}