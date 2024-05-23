
import BetterSSE from 'better-sse';

export function vehicleEvents( sseChannel ) {

  return async function vehicleEventsEndpoint(req, res) {
    const session = await BetterSSE.createSession(req, res);
	  sseChannel.register(session);
  }
}
