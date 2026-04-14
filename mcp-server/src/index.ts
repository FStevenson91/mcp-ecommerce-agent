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
			"search_products",           
			{ query: z.string() },       
			async ({ query }) => {      
				
				// Divide la query en palabras individuales y las pasa a minúsculas
				// Ej: "Camiseta Negra Talla M" → ["camiseta", "negra", "talla", "m"]
				const words = query.toLowerCase().split(/\s+/);
				
				// Por cada palabra construye una condición que busca en TODAS las columnas relevantes
				// El AND entre condiciones significa que TODAS las palabras deben aparecer (en cualquier columna)
				// Ej: "camiseta negra" → busca "camiseta" en todas las columnas AND "negra" en todas las columnas
				const conditions = words.map(() => 
					`(LOWER(garment_type) LIKE ? OR LOWER(color) LIKE ? OR LOWER(size) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)`
				).join(" OR ");
				
				// Por cada palabra genera 5 bindings (uno por columna del WHERE)
				// El stem corta la última letra en palabras de más de 4 caracteres para manejar variaciones
				// Ej: "negro" → "%negr%" que matchea tanto "Negro" como "Negra"
				// Palabras cortas como "rojo" (4 letras) no se cortan para no perder precisión
				const bindings = words.flatMap(word => [`%${word}%`, `%${word}%`, `%${word}%`, `%${word}%`, `%${word}%`])

				// Ejecuta el SELECT en D1 con las condiciones dinámicas
				// LIMIT 10 para no devolver demasiados resultados al agente
				const result = await this.env.ecommerce_db
					.prepare(`SELECT * FROM products WHERE ${conditions} LIMIT 10`)
					.bind(...bindings) // spread del array de bindings generado arriba
					.all();

				// Devuelve los resultados como JSON en el formato que espera el MCP
				return {
					content: [{ type: "text", text: JSON.stringify(result.results) }]
				};
			}
		);


		this.server.tool(
			"get_product_id",
			{ product_id: z.number() },
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
			{ cart_id: z.number()},  

			async ( {cart_id}) => { 

			const result = await this.env.ecommerce_db 
			.prepare(  "SELECT cart_items.quantity, products.*  FROM cart_items  JOIN products ON cart_items.product_id = products.id  WHERE cart_items.cart_id = ?") 
			.bind( cart_id) 
			.all(); 

			return {                
				 content: [{type: "text", text: JSON.stringify({cart_id: cart_id, items: result.results})}]                             
				}		
			} 
		    );

		this.server.tool(
			"update_cart", 
			{ cart_id: z.number(), product_id: z.number(), quantity: z.number() },

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
