import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import dotenv from "dotenv";

dotenv.config();

const client = new MultiServerMCPClient({
    "MCP Ecommerce Agent": {
        transport: "sse", //"Streamable HTTP", SSE significa Server-Sent Events, que es el protocolo que usa tu Worker para comunicarse con los clientes MCP.
        url: process.env.MCP_SERVER_URL || "http://127.0.0.1:8787/mcp",
    }
});

export async function connectMCP() {
    const tools = await client.getTools();
    return tools;
}