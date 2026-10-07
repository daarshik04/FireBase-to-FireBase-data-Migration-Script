require("dotenv").config();

const path = require("path");

const config = {
    sourceCredentialsPath: path.resolve(
        __dirname,
        "..",
        process.env.SOURCE_FIREBASE_CREDENTIALS_PATH
    ),

    destinationCredentialsPath: path.resolve(
        __dirname,
        "..",
        process.env.DESTINATION_FIREBASE_CREDENTIALS_PATH
    ),

    batchSize: 400,

    dryRun: process.argv.includes("--dry-run"),

    verifyOnly: process.argv.includes("--verify")
};


module.exports = config;