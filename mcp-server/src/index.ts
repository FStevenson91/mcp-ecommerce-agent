import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "MCP Ecommerce Agent",
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


		this.server.tool(
			"get_product_id",
			{ product_id: z.string() },
			async ({product_id}) => {
				const result = await this.env.ecommerce_db
				.prepare("SELECT * FROM products WHERE id = ?")
				.bind(product_id)
				.all();
				return {
					content: [{type: "text", text: JSON.stringify(result.results)}]
				}
			}

		);


		this.server.tool(
			"create_cart",
			{ items: z.array(
				z.object({
					product_id: z.number(),
					quantity: z.number()
				}))
			},
			async ({items}) => {
			const cart = await this.env.ecommerce_db
			.prepare("INSERT INTO carts DEFAULT VALUES RETURNING id")
			.run();
			const cartID = cart.results[0].id;

			for (const item of items){
				await this.env.ecommerce_db
				.prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?) ")
				.bind(cartID, item.product_id, item.quantity)
				.run();
			}
			
			return {
				content: [{type: "text", text: JSON.stringify({cart_id: cartID, items: items})}]
							}
			}
			);

		this.server.tool(  
			"get_cart", 
			{ cart_id: z.string()},  

			async ( {cart_id}) => { 

			const result = await this.env.ecommerce_db 
			.prepare(  "SELECT cart_items.quantity, products.*  FROM cart_items  JOIN products ON cart_items.product_id = products.id  WHERE cart_items.cart_id = ?") 
			.bind( cart_id ) 
			.all(); 

			return {                
				 content: [{type: "text", text: JSON.stringify({cart_id: cart_id, items: result.results})}]                             
				}		
			} 
		    );

		this.server.tool(
			"update_cart", 
			{ cart_id: z.string(), product_id: z.number(), quantity: z.number() },

			async ({cart_id, product_id, quantity}) =>{
				if (quantity === 0){
					await this.env.ecommerce_db
					.prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?")
					.bind(cart_id, product_id)
					.run();
				} else {
					await this.env.ecommerce_db
					.prepare("UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?")
					.bind(quantity, cart_id, product_id)
					.run();
				}
				return {                
				 content: [{type: "text" as const, text: JSON.stringify({cart_id: cart_id, product_id: product_id, quantity: quantity, action: quantity === 0 ? "removed" : "updated"})}]                             
				}	
			}
		);
	}
};

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
