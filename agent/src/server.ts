import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import { chat } from "./services/agent-service.js" 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) =>{
    try {
        const { message, conversationId = "default" } = req.body;
        const response = await chat(conversationId, message);
        res.json({ response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno del agente" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Agente corriendo en http://localhost:${PORT}`);
});