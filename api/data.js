const { neon } = require('@neondatabase/serverless');

async function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS lcd_state (
    id integer PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  return sql;
}

module.exports = async (req, res) => {
  try {
    const sql = await db();
    if (req.method === 'GET') {
      const rows = await sql`SELECT data, updated_at FROM lcd_state WHERE id=1`;
      if (!rows.length) return res.status(200).json({version:21, lines:[]});
      res.setHeader('Cache-Control','no-store, max-age=0');
      return res.status(200).json(rows[0].data);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.lines)) return res.status(400).json({error:'Invalid LCD data'});
      await sql`INSERT INTO lcd_state(id,data,updated_at)
        VALUES(1,${JSON.stringify(body)}::jsonb,now())
        ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`;
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, POST');
    return res.status(405).json({error:'Method not allowed'});
  } catch (e) {
    return res.status(500).json({error:e.message});
  }
};
