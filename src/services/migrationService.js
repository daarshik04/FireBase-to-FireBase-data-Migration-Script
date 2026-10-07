const { migrateDatabase } = require("../migrate");
const { verifyMigration } = require("../verify");
const { stats } = require("../stats");

let migrationRunning = false;

let migrationStatus = {
    state: "IDLE",
    startedAt: null,
    finishedAt: null,
    verificationPassed: null,
    error: null
};


function getMigrationStatus() {

    return {
        ...migrationStatus,

        running: migrationRunning,

        stats: {
            ...stats
        }
    };
}


async function runMigration() {

    try {

        console.log(
            "\nBackground migration started."
        );

        await migrateDatabase();

        console.log(
            "\nRunning migration verification..."
        );

        const verification =
            await verifyMigration();


        migrationStatus.state =
            verification.passed
                ? "COMPLETED"
                : "VERIFICATION_FAILED";


        migrationStatus.verificationPassed =
            verification.passed;


        migrationStatus.verification =
            verification;


        migrationStatus.finishedAt =
            new Date().toISOString();

    } catch (error) {

        console.error(
            "Background migration failed:",
            error
        );


        migrationStatus.state =
            "FAILED";

        migrationStatus.error =
            error.message;

        migrationStatus.finishedAt =
            new Date().toISOString();


    } finally {

        migrationRunning = false;
    }
}


function startMigration() {

    if (migrationRunning) {

        throw new Error(
            "A migration is already running."
        );
    }


    // Reset statistics
    stats.collectionsProcessed = 0;
    stats.documentsRead = 0;
    stats.documentsWritten = 0;
    stats.documentsSkipped = 0;
    stats.failures = 0;


    migrationRunning = true;


    migrationStatus = {

        state: "RUNNING",

        startedAt:
            new Date().toISOString(),

        finishedAt: null,

        verificationPassed: null,

        error: null
    };


    // IMPORTANT:
    // Do not await this.
    //
    // The migration runs in the background.

    runMigration();


    return getMigrationStatus();
}


module.exports = {
    startMigration,
    getMigrationStatus
};