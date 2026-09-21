import "server-only";

/**
 * Flux d'événements serveur (SSE).
 *
 * Le serveur regarde l'état toutes les `interval` millisecondes et ne pousse
 * que si la signature a changé : un score qui ne bouge pas ne consomme rien sur
 * le réseau. Le SSE traverse les proxys et se reconnecte tout seul, ce qui vaut
 * mieux qu'un WebSocket pour un tableau de scores.
 */
export function eventStream<T>({
  signature,
  payload,
  signal,
  interval = 2000,
  keepAlive = 25_000,
}: {
  signature: () => Promise<string>;
  payload: () => Promise<T>;
  signal: AbortSignal;
  interval?: number;
  keepAlive?: number;
}): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      let lastBeat = Date.now();
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* le client est déjà parti */
        }
      };

      const tick = async () => {
        if (closed) return;
        try {
          const current = await signature();
          if (current !== last) {
            last = current;
            send("state", await payload());
            lastBeat = Date.now();
          } else if (Date.now() - lastBeat > keepAlive) {
            // Un commentaire SSE garde la connexion en vie sans rien changer.
            controller.enqueue(encoder.encode(": ping\n\n"));
            lastBeat = Date.now();
          }
        } catch {
          stop();
        }
      };

      const timer = setInterval(tick, interval);
      signal.addEventListener("abort", stop);
      await tick();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Évite le tampon de nginx, qui retiendrait le flux.
      "x-accel-buffering": "no",
    },
  });
}
