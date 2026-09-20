export async function summarizeUsage(entity, query = {}) {
  const byEmail = new Map();
  let offset = 0;
  while (true) {
    const rows = await entity.filter(query, '-last_seen', 200, offset);
    for (const s of rows) {
      const key = s.user_email;
      const summary = byEmail.get(key) || { total_seconds: 0, session_count: 0, last_seen: s.last_seen, page_path: s.page_path, is_active: false, sessions: [] };
      summary.total_seconds += Number(s.duration_seconds) || 0;
      summary.session_count++;
      summary.is_active ||= !!s.is_active && new Date(s.last_seen).getTime() >= Date.now() - 90000;
      if (query.user_email && summary.sessions.length < 100) summary.sessions.push(s);
      byEmail.set(key, summary);
    }
    if (rows.length < 200) break;
    offset += rows.length;
  }
  return byEmail;
}