const {
    sourceDb,
    destinationDb
} = require("./firebase");

const config = require("./config");

const {
    stats
} = require("./stats");


// ==========================================
// Write documents in batches
// ==========================================

async function writeDocumentsInBatches(
    documents,
    destinationCollection
) {

    for (
        let i = 0;
        i < documents.length;
        i += config.batchSize
    ) {

        const batch =
            destinationDb.batch();


        const batchDocuments =
            documents.slice(
                i,
                i + config.batchSize
            );


        for (
            const document of batchDocuments
        ) {

            const destinationRef =
                destinationCollection.doc(
                    document.id
                );


            batch.set(
                destinationRef,
                document.data()
            );
        }


        if (!config.dryRun) {

            await batch.commit();

            stats.documentsWritten +=
                batchDocuments.length;

        } else {

            stats.documentsSkipped +=
                batchDocuments.length;
        }


        console.log(
            `${config.dryRun ? "[DRY RUN] " : ""}` +
            `Processed ${batchDocuments.length} documents`
        );
    }
}


// ==========================================
// Migrate a collection recursively
// ==========================================

async function migrateCollection(
    sourceCollection,
    destinationCollection
) {

    console.log(
        `\nCollection: ${sourceCollection.path}`
    );


    const snapshot =
        await sourceCollection.get();


    stats.collectionsProcessed++;


    stats.documentsRead +=
        snapshot.size;


    console.log(
        `Documents found: ${snapshot.size}`
    );


    // --------------------------------------
    // Copy documents in batches
    // --------------------------------------

    await writeDocumentsInBatches(
        snapshot.docs,
        destinationCollection
    );


    // --------------------------------------
    // Find subcollections
    // --------------------------------------

    for (
        const sourceDocument of snapshot.docs
    ) {

        const subcollections =
            await sourceDocument.ref
                .listCollections();


        // ----------------------------------
        // Recursively migrate each
        // subcollection
        // ----------------------------------

        for (
            const subcollection
            of subcollections
        ) {

            const destinationSubcollection =
                destinationCollection
                    .doc(sourceDocument.id)
                    .collection(
                        subcollection.id
                    );


            await migrateCollection(
                subcollection,
                destinationSubcollection
            );
        }
    }
}


// ==========================================
// Migrate entire Firestore database
// ==========================================

async function migrateDatabase() {

    console.log("\n");
    console.log("==========================================");
    console.log("       FIRESTORE MIGRATION STARTED");
    console.log("==========================================");


    if (config.dryRun) {

        console.log(
            "\n*** DRY RUN MODE ***"
        );

        console.log(
            "No data will be written.\n"
        );
    }


    const collections =
        await sourceDb.listCollections();


    console.log(
        `Top-level collections found: ${collections.length}`
    );


    for (
        const collection of collections
    ) {

        const destinationCollection =
            destinationDb.collection(
                collection.id
            );


        try {

            await migrateCollection(
                collection,
                destinationCollection
            );

        } catch (error) {

            stats.failures++;

            console.error(
                `\nFailed collection: ${collection.path}`
            );

            console.error(error);
        }
    }


    console.log("\nMigration process finished.");
}


module.exports = {
    migrateDatabase
};