// Pure scheduling and sense grouping, recovered without changing algorithms.
function _(e) {
  return e
    .replace(/[（）()]/g, ``)
    .split(/[；;、，,\/\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}
function ie(e, t) {
  let n = _(e),
    r = _(t);
  if (!n.length || !r.length) return !1;
  if (n[0] === r[0]) return !0;
  let i = n.filter((e) => r.includes(e)).length;
  return i > 0 && i / Math.min(n.length, r.length) >= 0.6;
}
function v(e) {
  let t = [];
  return (
    e.forEach((e) => {
      let n = e.gloss.trim();
      if (!n) return;
      let r = t.find((e) => e.gloss === n || ie(e.gloss, n));
      r ? r.senses.push(e) : t.push({ gloss: n, senses: [e] });
    }),
    t
  );
}
function fe(e) {
  return (
    e.tracks.includes(`TOPIK`) &&
    e.register === `正式` &&
    e.levels.some((e) => e >= 5)
  );
}
function pe(e, t) {
  return (
    [...e.senses]
      .sort(
        (e, t) =>
          Number(!!t.primary) - Number(!!e.primary) ||
          e.level - t.level ||
          e.id.localeCompare(t.id),
      )
      .find((e) => !t[e.id]) ?? null
  );
}
function me(e = 0) {
  let t = new Date();
  return (
    t.setDate(t.getDate() + e),
    `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, `0`)}-${String(t.getDate()).padStart(2, `0`)}`
  );
}
function he(e, t) {
  let n = new Date(),
    r = t
      ? Math.max(0, (n.getTime() - new Date(t.reviewedAt).getTime()) / 864e5)
      : 0,
    i = t
      ? Math.max(
          0.1,
          (new Date(t.dueAt).getTime() - new Date(t.reviewedAt).getTime()) /
            864e5,
        )
      : 0,
    a = t?.stability ?? i ?? 1,
    o = t?.difficulty ?? 5,
    s = (1 + r / (9 * Math.max(a, 0.1))) ** -1,
    c = Math.max(
      1,
      Math.min(
        10,
        o + (e === `remember` ? -0.35 * (1 + s) : e === `fuzzy` ? 0.28 : 0.95),
      ),
    ),
    l = (t?.lapses ?? 0) + +(e === `forgot`),
    ee =
      e === `remember`
        ? Math.min(60, Math.max(2.5, a * (1.7 + s - c / 12)))
        : e === `fuzzy`
          ? Math.max(0.45, a * (0.48 + s * 0.12))
          : 0.12,
    u =
      e === `forgot`
        ? 10 * 6e4
        : e === `fuzzy`
          ? Math.max(45 * 6e4, Math.round(ee * 864e5))
          : Math.round(ee * 864e5);
  return {
    reviewedAt: n.toISOString(),
    dueAt: new Date(n.getTime() + u).toISOString(),
    stability: ee,
    difficulty: c,
    lapses: l,
  };
}
function ge(e) {
  if (!e) return `等待判断`;
  let t = Math.max(1, Math.round((new Date(e).getTime() - Date.now()) / 6e4));
  if (t < 60) return `${t} 分钟后`;
  let n = Math.round(t / 60);
  return n < 24 ? `${n} 小时后` : `${Math.round(n / 24)} 天后`;
}
function ve(e, t) {
  let n = (e) =>
    Array.from(e).reduce((e, t) => (e * 31 + t.charCodeAt(0)) % 1000003, 7);
  return [...e].sort((e, r) => n(`${t}:${String(e)}`) - n(`${t}:${String(r)}`));
}
function b(e) {
  return v(e.senses);
}
function ye(e) {
  return e.senses[0]?.id;
}
function be(e) {
  return b(e).length > 1;
}
function xe(e, t) {
  return e.senses.some((e) => !!t[e.id]);
}
function Se(e, t) {
  return e.senses.some(
    (e) => !!(t[e.id]?.rating && t[e.id]?.rating !== `remember`),
  );
}
function Ce(e, t) {
  return e.senses.some((e) => t[e.id]?.rating === `remember`) && !Se(e, t);
}
function we(e) {
  let t = new Map();
  e.forEach((e) => t.set(e.word.id, [...(t.get(e.word.id) ?? []), e]));
  let n = Array.from(t.keys()),
    r = [];
  for (; n.length;)
    for (let e = 0; e < n.length; e += 1) {
      let i = n[e],
        a = t.get(i)?.shift();
      (a && r.push(a), t.get(i)?.length || (t.delete(i), n.splice(e, 1), --e));
    }
  return r;
}

export { he as schedule, ge as intervalLabel, me as localDate, v as groupSenses, we as interleave, fe as isSprint };
