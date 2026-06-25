import { NextRequest } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) API route.
 * Listens to a Redis Pub/Sub channel ('email-queue-events') populated by the BullMQ worker,
 * and streams live queue progress metrics to the dashboard frontend.
 */
export async function GET(req: NextRequest) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const subClient = new Redis(redisUrl);
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Periodically send heartbeats to prevent connection timeouts
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          // Stream is already closed
        }
      }, 15000);

      try {
        await subClient.subscribe('email-queue-events');
      } catch (err) {
        controller.error(err);
        clearInterval(heartbeatTimer);
        subClient.disconnect();
        return;
      }

      subClient.on('message', (channel, message) => {
        if (channel === 'email-queue-events') {
          try {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          } catch {
            // Controller might be closed
          }
        }
      });

      // Handle client-side disconnection / navigation away
      req.signal.addEventListener('abort', async () => {
        clearInterval(heartbeatTimer);
        try {
          await subClient.unsubscribe('email-queue-events');
          subClient.disconnect();
        } catch {
          // Ignore errors during clean up
        }
      });
    },
    cancel() {
      try {
        subClient.unsubscribe('email-queue-events');
        subClient.disconnect();
      } catch {
        // Ignore
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
