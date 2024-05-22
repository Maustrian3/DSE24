
import BetterSSE from 'better-sse';

export function logEvents( sseChannel ) {

  return async function logEventsEndpoint(req, res) {
    const session = await BetterSSE.createSession(req, res);
	  sseChannel.register(session);
  }
}
