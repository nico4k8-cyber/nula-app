// Returns country code based on Vercel's geolocation headers
// Used to decide whether to show Google OAuth (blocked in RU)
export default function handler(req, res) {
  const country = req.headers['x-vercel-ip-country'] ||
                  req.headers['cf-ipcountry'] ||
                  'XX';
  res.setHeader('Cache-Control', 'no-store');
  res.json({ country });
}
