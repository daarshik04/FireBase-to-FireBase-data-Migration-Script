const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const config = require("./config");

// ==============================
// Source Firebase Project
// ==============================

const sourceApp = initializeApp(
    {
        credential: cert(
            require(config.sourceCredentialsPath)
        )
    },
    "source"
);

// ==============================
// Destination Firebase Project
// ==============================

const destinationApp = initializeApp(
    {
        credential: cert(
            require(config.destinationCredentialsPath)
        )
    },
    "destination"
);

// ==============================
// Firestore instances
// ==============================

const sourceDb = getFirestore(sourceApp);

const destinationDb = getFirestore(destinationApp);

module.exports = {
    sourceDb,
    destinationDb
};