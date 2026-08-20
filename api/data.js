const { neon } = require('@neondatabase/serverless');

const DEFAULT_DATA = {
  lineName: "しょみん線",
  lineNameEn: "Shomin Line",
  serviceJa: "快速",
  serviceEn: "Rapid",
  destinationJa: "東ノ宮",
  destinationEn: "Higashinomiya",
  throughJa: "みらいじま線直通",
  throughEn: "Through to Miraijima Line",
  car: "5",
  currentCode: "NV12",
  transfersJa: ["森林線","東環状線"],
  transfersEn: ["Shinrin Line","East Loop Line"],
  stations: [
    ["江川","Egawa","NV11",2],
    ["しょみん","Shomin","NV12",0],
    ["しょみん村","Shominmura","NV13",2],
    ["船戸","Funato","NV14",4],
    ["山神","Yamagami","NV15",6],
    ["大吹","Obuki","NV16",9],
    ["呼塚","Yobuzuka","NV17",12],
    ["桜浜","Sakurahama","NV18",15],
    ["新桜浜","Shin-Sakurahama","NV19",18],
    ["武蔵多摩浜","Musashi-Tamahama","NV20",22],
    ["州久内","Shukunai","NV21",25],
    ["品山","Shinayama","NV22",28],
    ["新端","Shinhata","NV23",31],
    ["東ノ宮","Higashinomiya","NV24",35]
  ]
};

async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
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
    if (req.method === "GET") {
      const rows = await sql`SELECT data FROM lcd_state WHERE id=1`;
      if (!rows.length) {
        await sql`INSERT INTO lcd_state(id,data) VALUES(1,${JSON.stringify(DEFAULT_DATA)}::jsonb)`;
        return res.status(200).json(DEFAULT_DATA);
      }
      return res.status(200).json(rows[0].data);
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      await sql`INSERT INTO lcd_state(id,data,updated_at)
        VALUES(1,${JSON.stringify(body)}::jsonb,now())
        ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`;
      return res.status(200).json({ok:true});
    }
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({error:"Method not allowed"});
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
};
