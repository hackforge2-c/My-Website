
const firebaseConfig = {
  apiKey: "AIzaSyCOEbqMZifKAVoKlZDHmcslXduBUxxb1xU",
  authDomain: "hackproof-feb59.firebaseapp.com",
  projectId: "hackproof-feb59",
  storageBucket: "hackproof-feb59.firebasestorage.app",
  messagingSenderId: "309682905913",
  appId: "1:309682905913:web:7e32f772ed2e82672b3ee8",
  measurementId: "G-PKSRE0Z6CC"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();