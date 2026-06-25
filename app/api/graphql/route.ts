import { ApolloServer } from '@apollo/server';
import { resolvers } from '@/graphql/resolvers';
import { createContext } from '@/graphql/context';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { readFileSync } from 'fs';
import path from 'path';

declare global {
  var apolloServerGlobal: ApolloServer<any> | undefined;
}

/**
 * Starts and caches the Apollo Server instance to prevent starting overhead
 * during development hot reloads.
 */
async function getApolloServer(): Promise<ApolloServer<any>> {
  if (process.env.NODE_ENV === 'development') {
    globalThis.apolloServerGlobal = undefined;
  }
  
  if (!globalThis.apolloServerGlobal) {
    const typeDefs = readFileSync(
      path.join(process.cwd(), 'graphql/schema/schema.graphql'),
      'utf-8'
    );
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });
    await server.start();
    globalThis.apolloServerGlobal = server;
  }
  return globalThis.apolloServerGlobal;
}

export async function POST(req: Request) {
  try {
    const server = await getApolloServer();
    
    // Authenticate session
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;
    
    // Instantiate per-request context (with database & DataLoaders)
    const context = createContext(userId);

    const body = await req.json();
    console.log('[GraphQL API] Received POST request body:', JSON.stringify(body).slice(0, 100));
    const response = await server.executeOperation(
      {
        query: body.query,
        variables: body.variables,
        operationName: body.operationName,
      },
      {
        contextValue: context,
      }
    );

    if (response.body.kind === 'single') {
      const result = response.body.singleResult;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(response.body), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ errors: [{ message: err.message || 'GraphQL Execution Failed' }] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  return new Response('GraphQL endpoint is active. Send POST requests to run queries and mutations.', {
    status: 200,
  });
}
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
