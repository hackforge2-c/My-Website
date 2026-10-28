// Shared CTF client. Flags are checked and points awarded by the `submitFlag`
// Cloud Function - nothing here (or in localStorage) can change your score.
// Needs: firebase app/auth/firestore/functions compat SDKs + firebase-config.js.
const functionsClient = firebase.app().functions("us-central1");
const submitFlagFn = functionsClient.httpsCallable("submitFlag");

function showResult(el, ok, text) {
  const span = document.createElement("span");
  span.style.color = ok ? "var(--primary)" : "var(--danger)";
  span.textContent = text;
  el.replaceChildren(span);
}

async function submitFlag(challenge, level, flag, resultEl) {
  if (!auth.currentUser) {
    showResult(resultEl, false, "Log in to submit flags and earn points.");
    return null;
  }
  showResult(resultEl, true, "Checking...");
  try {
    const { data } = await submitFlagFn({ challenge, level, flag });
    if (!data.correct) {
      showResult(resultEl, false, "Wrong");
    } else if (data.awarded) {
      showResult(resultEl, true, "Correct +" + data.awarded);
      refreshScore("scoreDisplay");
    } else {
      showResult(resultEl, true, "Correct (already solved, no extra points)");
    }
    return data;
  } catch (e) {
    showResult(resultEl, false, "Could not check the flag right now.");
    return null;
  }
}

function refreshScore(elId) {
  auth.onAuthStateChanged(async (user) => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!user) { el.textContent = "SCORE: log in"; return; }
    const snap = await db.collection("users").doc(user.uid).get();
    el.textContent = "SCORE: " + ((snap.data() || {}).points || 0);
  });
}
