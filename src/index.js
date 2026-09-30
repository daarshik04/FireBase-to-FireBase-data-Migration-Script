const {
    migrateDatabase
} = require("./migrate");

const {
    verifyMigration
} = require("./verify");

const {
    printReport
} = require("./stats");

const config = require("./config");


async function main() {

    try {

        // ==================================
        // Verification-only mode
        // ==================================

        if (config.verifyOnly) {

            const success =
                await verifyMigration();


            process.exit(
                success ? 0 : 1
            );
        }


        // ==================================
        // Migration
        // ==================================

        await migrateDatabase();


        // ==================================
        // Print migration report
        // ==================================

        printReport();


        // ==================================
        // Don't verify dry runs
        // ==================================

        if (config.dryRun) {

            console.log(
                "\nDry run finished."
            );

            return;
        }


        // ==================================
        // Verify actual migration
        // ==================================

        const success =
            await verifyMigration();


        if (!success) {

            process.exit(1);
        }


    } catch (error) {

        console.error(
            "\nMigration failed:"
        );

        console.error(error);

        process.exit(1);
    }
}


main();