import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadDailyVulnerability() {
    const snapshot = await getDocs(collection(db, "vulnerabilities"));
    const vulnerabilities = snapshot.docs.map(doc => doc.data());

    // Date logic
    const today = new Date();
    const dayNumber = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

    const todayVuln = vulnerabilities[dayNumber % vulnerabilities.length];

    document.getElementById("vulnName").innerText = todayVuln.name;
    document.getElementById("vulnRisk").innerText = "Risk: " + todayVuln.risk;
    document.getElementById("vulnDesc").innerText = todayVuln.description;
    document.getElementById("vulnPrev").innerText = "Prevention: " + todayVuln.prevention;
}

loadDailyVulnerability();