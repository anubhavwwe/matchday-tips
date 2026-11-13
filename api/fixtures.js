// Runs on Vercel. Your key stays here, never in the page.
const CODES = { PL: "PL", PD: "LL", SA: "SA", BL1: "BL", FL1: "L1" };
const DAY = 864e5;

module.exports = async (req, res) => {
  const now = Date.now();
  const from = now - 2 * DAY;
  const to = now + 14 * DAY;
  const d = new Date(now);
  const season = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;

  const results = await Promise.allSettled(
    Object.keys(CODES).map(async (c) => {
      const r = await fetch(
        `https://api.football-data.org/v4/competitions/${c}/matches?season=${season}`,
        { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY } }
      );
      if (!r.ok) throw new Error(c + " HTTP " + r.status);
      const j = await r.json();
      return j.matches
        .filter((m) => { const t = Date.parse(m.utcDate); return t >= from && t <= to; })
        .map((m) => ({
          l: CODES[c],
          h: m.homeTeam.shortName || m.homeTeam.name,
          w: m.awayTeam.shortName || m.awayTeam.name,
          t: m.utcDate,
          s: m.status,
        }));
    })
  );

  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length) {
    res.status(502).json({ error: "Fixtures unavailable", detail: results.map((r) => String(r.reason)) });
    return;
  }
  // Saved for 1 hour: visitors share one copy, so API usage stays tiny.
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).json(ok.flatMap((r) => r.value));
};
