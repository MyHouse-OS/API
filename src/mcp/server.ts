import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyClientAuth } from "../utils/auth";
import { setAuthorization, tools } from "./tools";

export interface McpToolResponse {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

export async function wrapToolHandler(
	handler: (args: Record<string, unknown>) => Promise<unknown>,
	args: Record<string, unknown>,
): Promise<McpToolResponse> {
	try {
		const result = await handler(args);
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify({ error: message }, null, 2),
				},
			],
			isError: true,
		};
	}
}

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version",
	"Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

export async function startMcpServer() {
	const MCP_PORT = Number(process.env.MCP_PORT) || 3001;

	const server = new McpServer({
		name: "myhouse-os",
		version: "1.0.0",
	});

	for (const [name, tool] of Object.entries(tools)) {
		server.tool(name, tool.description, tool.inputSchema.shape, async (args) => {
			return wrapToolHandler(
				tool.handler as (args: Record<string, unknown>) => Promise<unknown>,
				args,
			);
		});
	}

	const transport = new WebStandardStreamableHTTPServerTransport();

	await server.connect(transport);

	Bun.serve({
		port: MCP_PORT,
		async fetch(req) {
			const url = new URL(req.url);

			if (req.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: corsHeaders });
			}

			if (url.pathname === "/health") {
				return new Response(JSON.stringify({ status: "ok", server: "myhouse-os-mcp" }), {
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				});
			}

			if (url.pathname === "/mcp") {
				const authorization = req.headers.get("authorization");

				const authResult = await verifyClientAuth(authorization);
				if (!authResult.valid) {
					return new Response(JSON.stringify({ error: authResult.error }), {
						status: 401,
						headers: { ...corsHeaders, "Content-Type": "application/json" },
					});
				}
				console.log(`MCP request from authenticated client: ${authResult.clientId}`);

				setAuthorization(authorization || "");

				const response = await transport.handleRequest(req);

				const newHeaders = new Headers(response.headers);
				for (const [key, value] of Object.entries(corsHeaders)) {
					newHeaders.set(key, value);
				}

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: newHeaders,
				});
			}

			return new Response("Not Found", { status: 404, headers: corsHeaders });
		},
	});

	console.log(`MCP server running on http://localhost:${MCP_PORT}`);
	console.log(`MCP endpoint: http://localhost:${MCP_PORT}/mcp`);
	console.log(`Health check: http://localhost:${MCP_PORT}/health`);
}
