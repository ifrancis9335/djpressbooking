const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey
    })
  });
}

async function main() {
  const db = getFirestore();

  const blockedSnapshot = await db.collection("blocked_dates").orderBy("date", "asc").limit(5).get();
  const confirmedSnapshot = await db.collection("bookings").where("status", "==", "confirmed").limit(5).get();

  const blockedDates = blockedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const confirmedDates = confirmedSnapshot.docs.map((doc) => ({
    id: doc.id,
    eventDate: doc.data().eventDate,
    status: doc.data().status,
    name: doc.data().fullName
  }));

  console.log(JSON.stringify({ blockedDates, confirmedDates }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});