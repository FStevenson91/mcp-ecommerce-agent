# MCP Ecommerce Agent

Este proyecto replica un desafío técnico de AI Engineer, construido para demostrar cómo un agente de IA puede manejar una conversación de ventas end-to-end usando Model Context Protocol (MCP).

El agente se llama Arturo. Atiende al cliente, busca productos en una base de datos real, arma carritos y los edita — todo en lenguaje natural, sin menús ni flujos predefinidos.

Demo en vivo: [mcp-ecommerce-agent.vercel.app](https://mcp-ecommerce-agent.vercel.app)

---

## Cómo funciona

```
Frontend (Vercel)  →  Agent API (Azure)  →  MCP Server (Cloudflare Worker)
     React              LangGraph                 Tools + D1 Database
```

El frontend manda mensajes al agente vía HTTP. El agente usa LangGraph ReAct para razonar y decidir qué tools llamar según lo que pide el usuario. Las tools están expuestas por un MCP Server en un Cloudflare Worker, conectado a una base de datos D1.

---

## Stack

| Capa | Tecnología |
|---|---|
| Agente | Node.js · TypeScript · LangChain · LangGraph · Groq (Llama 4 Scout) |
| MCP Server | Cloudflare Workers · Cloudflare D1 · MCP SDK |
| Frontend | React · Vite · TypeScript |
| Deploy | Azure App Service · Vercel · GitHub Actions |

---

## Por qué este stack

Usé Cloudflare Workers para el MCP Server porque el desafío lo pedía explícitamente, y D1 es la opción más directa para tener una base de datos en el mismo edge sin agregar servicios externos. Para el agente elegí LangGraph sobre una implementación manual de tool calling porque `createReactAgent` maneja el loop de razonamiento por uno — menos código, mismo resultado. Groq con Llama 4 Scout porque tiene tool calling nativo confiable y latencia baja, lo que importa en una conversación en tiempo real.

---

## Tools del MCP

| Tool | Descripción |
|---|---|
| `search_products` | Busca productos por texto libre (tipo, color, talla, categoría) |
| `get_product_id` | Obtiene detalle de un producto por ID |
| `create_cart` | Crea un carrito nuevo con uno o varios productos |
| `get_cart` | Muestra todos los items del carrito con detalle de producto |
| `update_cart` | Actualiza cantidad de un item (quantity: 0 elimina el item) |

---

## Estructura del repo

```
mcp-ecommerce-agent/
├── mcp-server/          # Cloudflare Worker + D1
│   ├── src/index.ts     # Tools MCP
│   ├── schema.sql       # Tablas: products, carts, cart_items
│   ├── seed.sql         # 100 productos
│   └── wrangler.toml
├── agent/               # API del agente
│   ├── src/
│   │   ├── server.ts              # Express POST /chat
│   │   ├── services/
│   │   │   ├── agent-service.ts   # LangGraph ReAct agent
│   │   │   └── mcp-client.ts      # Conexión al MCP Server
│   │   └── config/prompt.ts       # System prompt de Arturo
│   └── package.json
├── frontend/            # Chat UI en React
├── docs/                # Diagrama de arquitectura y flujo
└── .github/workflows/   # CI/CD → Azure App Service
```

---

## Correr localmente

### MCP Server

```bash
cd mcp-server
npm install
npx wrangler dev
# Corre en http://localhost:8787/mcp
```

### Agente

```bash
cd agent
npm install
```

Crea un `.env`:

```
GROQ_API_KEY=tu_api_key
MCP_SERVER_URL=http://localhost:8787/mcp
PORT=3001
```

```bash
npm run dev
# Corre en http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
```

Crea un `.env.local`:

```
VITE_AGENT_URL=http://localhost:3001
```

```bash
npm run dev
# Abre en http://localhost:5173
```

---

## Variables de entorno en producción

**Azure App Service (agente):**
- `GROQ_API_KEY`
- `MCP_SERVER_URL` → URL del Worker en Cloudflare
- `PORT` → 8080

**Vercel (frontend):**
- `VITE_AGENT_URL` → URL del agente en Azure

---

## Deploy

El agente se despliega automáticamente a Azure App Service con cada push a `main` vía GitHub Actions.

El MCP Server se despliega manualmente:

```bash
cd mcp-server
npx wrangler deploy
```

---

## Modelo de datos

```sql
products    → id, garment_type, size, color, stock, price_50, price_100, price_200, available, category, description
carts       → id, created_at, updated_at
cart_items  → id, cart_id, product_id, quantity
```