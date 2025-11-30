import { versions } from "./save-version"; 

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    
    try {
        // 2. Use the imported in-memory array
        const list = versions.slice().reverse(); 
        
        return res.status(200).json({ versions: list });
    } catch (e) {
        console.error("Error reading in-memory versions:", e);
        return res.status(200).json({ versions: [] });
    }
}