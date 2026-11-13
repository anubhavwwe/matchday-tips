// Runs on Vercel. Your key stays here, never in the page.
const MAP = { PL: "PL", PD: "LL", SA: "SA", BL1: "BL", FL1: "L1" };
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

module.exports = async (req, res) => {
  try {
    const url = `https://api.football-data.org/v4/matches?dateFrom=${day(-2)}&dateTo=${day(7)}&competitions=PL,PD,SA,BL1,FL1`;
    const r = await fetch(url, { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY } });
    if (!r.ok) throw new Error("upstream " + r.status);
    const j = await r.json();
    const out = j.matches.map((m) => ({
      l: MAP[m.competition.code],
      h: m.homeTeam.shortName || m.homeTeam.name,
      w: m.awayTeam.shortName || m.awayTeam.name,
      t: m.utcDate,
      s: m.status,
    }));
    // Saved for 1 hour: visitors share one copy, so API usage stays tiny.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(out);
  } catch (e) {
    res.status(502).json({ error: "Fixtures unavailable" });
  }
};
