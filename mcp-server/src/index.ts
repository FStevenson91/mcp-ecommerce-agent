import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {

		this.server.tool(
			"search_products",           // 1. nombre de la tool (string)
			{ query: z.string() },       // 2. parámetros con validación zod
			async ({ query }) => {       // 3. función que ejecuta la lógica
				// acá va el SELECT a D1
				const searchTerm = `%${query}%`;
				const result = await this.env.ecommerce_db // aca debemos configurar en worker-configuration.d.ts el binding a D1 con el nombre "ecommerce_db", en interface ENV junto al MCP_OBJECT
					.prepare("SELECT * FROM products WHERE garment_type LIKE ? OR color LIKE ? OR category LIKE ? OR description LIKE ?")
					.bind(searchTerm, searchTerm, searchTerm, searchTerm)
					.all();
					return {
						content: [{ type: "text", text: JSON.stringify(result.results) }]
					};
			}
		);

		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
