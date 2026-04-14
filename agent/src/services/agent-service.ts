import { ChatGroq } from "@langchain/groq";
import { SYSTEM_PROMPT } from "../config/prompt.js";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { connectMCP } from "./mcp-client.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama-3.1-70b-versatile",
});

let agent: any = null;
// Historial de mensajes por conversación
const conversations: Map<string, BaseMessage[]> = new Map();

export async function initAgent() {
    const tools = await connectMCP();
    // Las tools del MCP vienen sin descripción, Groq la requiere
    tools.forEach((tool: any) => {
        if (!tool.description) {
            tool.description = tool.name.replace(/_/g, " ");
        }
    });

    agent = createReactAgent({
        llm: model,
        tools: tools,
        stateModifier: SYSTEM_PROMPT,// Fix: stateModifier en vez de prompt
    });

    console.log(`Agente listo. Tools: ${tools.map((t: any) => t.name).join(", ")}`);
}

export async function chat(conversationId: string, message: string) {
    if (!agent) {
        await initAgent();
    }

    // Obtener historial o crear uno nuevo
    const history = conversations.get(conversationId) || [];

    const humanMessage = new HumanMessage({ content: message });

    const result = await agent.invoke({
        messages: [ ...history, humanMessage ],
    });

    // Guardar todo el historial actualizado
    conversations.set(conversationId, result.messages);

    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content as string;
}