const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest({ request, env }) {
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (method === 'GET') {
    try {
      const stored = await env.ROSTERS.get('all_rosters');
      const rosters = stored ? JSON.parse(stored) : [];
      return Response.json({ rosters }, { headers: CORS_HEADERS });
    } catch {
      return Response.json({ error: 'Failed to read rosters' }, { status: 500, headers: CORS_HEADERS });
    }
  }

  if (method === 'POST') {
    try {
      const { roster } = await request.json();
      const stored = await env.ROSTERS.get('all_rosters');
      const rosters = stored ? JSON.parse(stored) : [];
      const idx = rosters.findIndex((r) => r.label === roster.label);
      if (idx !== -1) {
        rosters[idx] = roster;
      } else {
        rosters.push(roster);
      }
      await env.ROSTERS.put('all_rosters', JSON.stringify(rosters));
      return Response.json({ ok: true }, { headers: CORS_HEADERS });
    } catch {
      return Response.json({ error: 'Failed to save roster' }, { status: 500, headers: CORS_HEADERS });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
}
