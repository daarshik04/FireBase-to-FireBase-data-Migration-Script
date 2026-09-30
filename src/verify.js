const {
    sourceDb,
    destinationDb
} = require("./firebase");


// ==========================================
// Collect all document paths recursively
// ==========================================

async function collectDocumentPaths(
    collection,
    paths
) {

    const snapshot =
        await collection.get();


    for (
        const document of snapshot.docs
    ) {

        paths.add(
            document.ref.path
        );


        const subcollections =
            await document.ref
                .listCollections();


        for (
            const subcollection
            of subcollections
        ) {

            await collectDocumentPaths(
                subcollection,
                paths
            );
        }
    }
}


// ==========================================
// Get all database document paths
// ==========================================

async function getDatabasePaths(db) {

    const paths = new Set();


    const collections =
        await db.listCollections();


    for (
        const collection of collections
    ) {

        await collectDocumentPaths(
            collection,
            paths
        );
    }


    return paths;
}


// ==========================================
// Verify source vs destination
// ==========================================

async function verifyMigration() {

    console.log("\n");
    console.log("==========================================");
    console.log("          VERIFYING MIGRATION");
    console.log("==========================================");


    console.log(
        "\nReading source document paths..."
    );


    const sourcePaths =
        await getDatabasePaths(
            sourceDb
        );


    console.log(
        "Reading destination document paths..."
    );


    const destinationPaths =
        await getDatabasePaths(
            destinationDb
        );


    // --------------------------------------
    // Find missing documents
    // --------------------------------------

    const missing =
        [...sourcePaths].filter(
            path =>
                !destinationPaths.has(path)
        );


    // --------------------------------------
    // Find unexpected documents
    // --------------------------------------

    const extra =
        [...destinationPaths].filter(
            path =>
                !sourcePaths.has(path)
        );


    console.log("\n");
    console.log(
        `Source document count      : ${sourcePaths.size}`
    );

    console.log(
        `Destination document count : ${destinationPaths.size}`
    );

    console.log(
        `Missing documents          : ${missing.length}`
    );

    console.log(
        `Extra documents            : ${extra.length}`
    );


    // --------------------------------------
    // Report missing
    // --------------------------------------

    if (missing.length > 0) {

        console.log("\nMissing documents:");

        for (
            const path of missing
        ) {

            console.log(
                `  ${path}`
            );
        }
    }


    // --------------------------------------
    // Report extra
    // --------------------------------------

    if (extra.length > 0) {

        console.log("\nUnexpected documents:");

        for (
            const path of extra
        ) {

            console.log(
                `  ${path}`
            );
        }
    }


    // --------------------------------------
    // Final result
    // --------------------------------------

    if (
        missing.length === 0 &&
        extra.length === 0
    ) {

        console.log(
            "\nVerification PASSED."
        );

        return true;
    }


    console.log(
        "\nVerification FAILED."
    );

    return false;
}


module.exports = {
    verifyMigration
};