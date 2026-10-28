const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// Keep the public leaderboard in sync with the private users doc.
exports.syncLeaderboard = onDocumentWritten("users/{uid}", async (event) => {
  const ref = admin.firestore().doc(`leaderboard/${event.params.uid}`);
  const after = event.data.after;
  if (!after.exists) return ref.delete();
  const { username, points } = after.data();
  return ref.set({ username: String(username || "Anonymous").slice(0, 30), points: points || 0 });
});

const SYSTEM = `You are HackForge AI, a cybersecurity learning assistant on the HackForge platform.
- Explain concepts clearly (XSS, SQLi, networking, Linux, tools like nmap, Burp, Wireshark).
- For CTF challenges give hints step by step, never the full flag.
- Use code blocks for commands. Be concise and encouraging.
- Never help with illegal or unauthorized attacks.`;

// Chat proxy: the browser never sees the API key.
exports.chat = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("POST only");

    const token = (req.get("Authorization") || "").replace("Bearer ", "");
    try { await admin.auth().verifyIdToken(token); }
    catch { return res.status(401).json({ error: "Sign in to use the AI assistant." }); }

    const { messages, context } = req.body || {};
    if (!Array.isArray(messages) || messages.length > 30)
      return res.status(400).json({ error: "Bad request" });
    const clean = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY.value(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1000,
        system: `${SYSTEM}\n\n${String(context || "").slice(0, 200)}`,
        messages: clean,
      }),
    });
    res.status(r.status).json(await r.json());
  }
);

// ---- CTF: server-side flag checking + scoring ----
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const crypto = require("crypto");
const FLAGS = require("./flags");

const sha256 = (t) => crypto.createHash("sha256").update(t).digest("hex");

exports.submitFlag = onCall({ maxInstances: 10 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Log in first.");
  const { challenge, level, flag } = req.data || {};
  const id = `${Number(challenge)}-${Number(level)}`;
  const entry = FLAGS[id];
  if (!entry || typeof flag !== "string" || flag.length > 200)
    throw new HttpsError("invalid-argument", "Bad submission.");

  const given = Buffer.from(sha256(flag.trim()));
  const real = Buffer.from(entry.hash);
  if (!crypto.timingSafeEqual(given, real)) return { correct: false };

  const db = admin.firestore();
  const userRef = db.doc(`users/${req.auth.uid}`);
  const solveRef = userRef.collection("solves").doc(id);
  const awarded = await db.runTransaction(async (t) => {
    if ((await t.get(solveRef)).exists) return 0;
    t.set(solveRef, { points: entry.points, at: admin.firestore.FieldValue.serverTimestamp() });
    t.set(userRef, { points: admin.firestore.FieldValue.increment(entry.points) }, { merge: true });
    return entry.points;
  });
  return { correct: true, awarded };
});

// ---- Certificates: issued by the server, from the user's real score ----
const CERT_MIN_POINTS = 100;

exports.issueCertificate = onCall({ maxInstances: 5 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Log in first.");
  const course = String((req.data || {}).course || "Cybersecurity Training").slice(0, 60);
  const db = admin.firestore();
  const userRef = db.doc(`users/${req.auth.uid}`);
  const user = (await userRef.get()).data() || {};
  if ((user.points || 0) < CERT_MIN_POINTS)
    throw new HttpsError("failed-precondition", `Earn ${CERT_MIN_POINTS} points in the CTF Arena to unlock certificates.`);

  const issuedRef = userRef.collection("issued").doc(crypto.createHash("sha1").update(course).digest("hex"));
  const issued = await issuedRef.get();
  if (issued.exists) return issued.data();

  const certId = "HP-" + crypto.randomBytes(5).toString("hex").toUpperCase();
  const cert = {
    certId,
    username: String(user.username || "HackForge Learner").slice(0, 60),
    course,
    date: new Date().toISOString().slice(0, 10),
  };
  await db.doc(`certificates/${certId}`).set({ username: cert.username, course, date: cert.date });
  await issuedRef.set(cert);
  return cert;
});
