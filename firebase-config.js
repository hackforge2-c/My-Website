// Shared Firebase setup. Load AFTER the firebase-app/auth/firestore compat SDKs (9.23.0).
// The web API key is public by design - access is enforced by firestore.rules, not by hiding this file.
const firebaseConfig = {
  apiKey: "AIzaSyCOEbqMZifKAVoKlZDHmcslXduBUxxb1xU",
  authDomain: "hackproof-feb59.firebaseapp.com",
  projectId: "hackproof-feb59",
  storageBucket: "hackproof-feb59.firebasestorage.app",
  messagingSenderId: "309682905913",
  appId: "1:309682905913:web:7e32f772ed2e82672b3ee8",
  measurementId: "G-PKSRE0Z6CC"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
