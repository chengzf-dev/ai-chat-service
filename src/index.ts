import { graphql } from 'graphql';
import { schema } from './schema';
import { createChatGPTService } from './chatgpt';

// Cloudflare Workers types
interface Env {
	OPENAI_API_KEY?: string;
	OPENAI_MODEL?: string;
	MAX_TOKENS?: string;
	TEMPERATURE?: string;
	ENVIRONMENT?: string;
	ALLOWED_ORIGINS?: string;
}

type ExecutionContext = {
	waitUntil(promise: Promise<any>): void;
	passThroughOnException(): void;
};

type ExportedHandler<Env = unknown> = {
	fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> | Response;
};

// CORS headers for GraphQL endpoint
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
function handleCORS(request: Request): Response | null {
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: corsHeaders,
		});
	}
	return null;
}

// Parse GraphQL request
async function parseGraphQLRequest(request: Request): Promise<{
	query: string;
	variables?: any;
	operationName?: string;
} | null> {
	const contentType = request.headers.get('content-type');
	
	if (request.method === 'POST') {
		if (contentType?.includes('application/json')) {
			try {
				const body = await request.json() as {
					query: string;
					variables?: any;
					operationName?: string;
				};
				return body;
			} catch {
				return null;
			}
		} else if (contentType?.includes('application/graphql')) {
			const query = await request.text();
			return { query };
		}
	} else if (request.method === 'GET') {
		const url = new URL(request.url);
		const query = url.searchParams.get('query');
		const variables = url.searchParams.get('variables');
		const operationName = url.searchParams.get('operationName');
		
		if (query) {
			return {
				query,
				variables: variables ? JSON.parse(variables) : undefined,
				operationName: operationName || undefined,
			};
		}
	}
	
	return null;
}

// Main worker export
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS
		const corsResponse = handleCORS(request);
		if (corsResponse) {
			return corsResponse;
		}

		const url = new URL(request.url);
		
		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({ 
				status: 'healthy', 
				timestamp: new Date().toISOString(),
				version: '1.0.0'
			}), {
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders 
				}
			});
		}

		// GraphQL endpoint
		if (url.pathname === '/graphql') {
			const graphqlRequest = await parseGraphQLRequest(request);
			
			if (!graphqlRequest) {
				return new Response(JSON.stringify({ 
					error: 'Invalid GraphQL request' 
				}), {
					status: 400,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders 
					}
				});
			}

			try {
				// Create ChatGPT service instance
				const chatService = createChatGPTService(env);
				
				// Execute GraphQL query with context
				const result = await graphql({
					schema,
					source: graphqlRequest.query,
					variableValues: graphqlRequest.variables,
					operationName: graphqlRequest.operationName,
					contextValue: {
						chatService,
						env,
						request
					}
				});

				return new Response(JSON.stringify(result), {
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders 
					}
				});
			} catch (error) {
				console.error('GraphQL execution error:', error);
				return new Response(JSON.stringify({ 
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error'
				}), {
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders 
					}
				});
			}
		}

		// GraphQL Playground (for development)
		if (url.pathname === '/playground' || url.pathname === '/') {
			const playgroundHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>AI Chat Service - GraphQL Playground</title>
				<style>
					body { font-family: Arial, sans-serif; margin: 40px; }
					.container { max-width: 800px; margin: 0 auto; }
					h1 { color: #333; }
					.endpoint { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; }
					code { background: #e8e8e8; padding: 2px 4px; border-radius: 2px; }
					.example { background: #f9f9f9; padding: 15px; border-left: 4px solid #007acc; margin: 15px 0; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>🤖 AI Chat Service</h1>
					<p>Welcome to the AI Chat Service GraphQL API!</p>
					
					<h2>Endpoints</h2>
					<div class="endpoint">
						<strong>GraphQL:</strong> <code>/graphql</code>
					</div>
					<div class="endpoint">
						<strong>Health Check:</strong> <code>/health</code>
					</div>
					
					<h2>Example Queries</h2>
					<div class="example">
						<h3>Hello Query</h3>
						<pre>query {
  hello
}</pre>
					</div>
					
					<div class="example">
						<h3>Chat Query</h3>
						<pre>query {
  chat(message: "Hello, how are you?") {
    id
    message
    timestamp
    model
  }
}</pre>
					</div>
					
					<div class="example">
						<h3>Send Message Mutation</h3>
						<pre>mutation {
  sendMessage(input: {
    message: "What is the weather like?"
    model: "gpt-3.5-turbo"
  }) {
    id
    message
    timestamp
    model
  }
}</pre>
					</div>
					
					<p><strong>Note:</strong> This service is configured to use mock responses when no OpenAI API key is provided.</p>
				</div>
			</body>
			</html>
			`;
			
			return new Response(playgroundHTML, {
				headers: { 
					'Content-Type': 'text/html',
					...corsHeaders 
				}
			});
		}

		// 404 for other routes
		return new Response(JSON.stringify({ 
			error: 'Not Found',
			message: 'Available endpoints: /, /graphql, /health'
		}), {
			status: 404,
			headers: { 
				'Content-Type': 'application/json',
				...corsHeaders 
			}
		});
	},
} satisfies ExportedHandler<Env>;
