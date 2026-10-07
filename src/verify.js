const {
    sourceDb,
    destinationDb
} = require("./firebase");


/*
 * Convert Firestore values into a
 * comparable representation.
 */
function normalizeValue(value) {

    if (value === null) {
        return null;
    }


    if (value === undefined) {
        return undefined;
    }


    // Firestore Timestamp
    if (
        value &&
        typeof value.toMillis === "function" &&
        typeof value.toDate === "function"
    ) {
        return {
            __type: "timestamp",
            value: value.toMillis()
        };
    }


    // Firestore GeoPoint
    if (
        value &&
        typeof value.latitude === "number" &&
        typeof value.longitude === "number"
    ) {
        return {
            __type: "geopoint",
            latitude: value.latitude,
            longitude: value.longitude
        };
    }


    // Firestore DocumentReference
    if (
        value &&
        typeof value.path === "string" &&
        value.firestore
    ) {
        return {
            __type: "documentReference",
            path: value.path
        };
    }


    // Buffer / binary data
    if (Buffer.isBuffer(value)) {
        return {
            __type: "buffer",
            value: value.toString("base64")
        };
    }


    // Arrays
    if (Array.isArray(value)) {

        return value.map(
            item => normalizeValue(item)
        );
    }


    // Objects / maps
    if (
        typeof value === "object"
    ) {

        const normalized = {};

        const keys =
            Object.keys(value).sort();


        for (const key of keys) {

            normalized[key] =
                normalizeValue(value[key]);
        }


        return normalized;
    }


    // Primitive values
    return value;
}


/*
 * Compare two Firestore document data objects.
 */
function documentsAreEqual(
    sourceData,
    destinationData
) {

    const source =
        normalizeValue(sourceData);

    const destination =
        normalizeValue(destinationData);


    return JSON.stringify(source) ===
           JSON.stringify(destination);
}


/*
 * Recursively collect every document
 * and its data.
 */
async function collectDocuments(
    collection,
    documents
) {

    const snapshot =
        await collection.get();


    for (const document of snapshot.docs) {

        documents.set(
            document.ref.path,
            document.data()
        );


        const subcollections =
            await document.ref.listCollections();


        for (
            const subcollection
            of subcollections
        ) {

            await collectDocuments(
                subcollection,
                documents
            );
        }
    }
}


/*
 * Get all documents from a Firestore database.
 */
async function getDatabaseDocuments(db) {

    const documents = new Map();


    const collections =
        await db.listCollections();


    for (const collection of collections) {

        await collectDocuments(
            collection,
            documents
        );
    }


    return documents;
}


/*
 * Verify source and destination databases.
 */
async function verifyMigration() {

    console.log("\n");
    console.log(
        "=========================================="
    );
    console.log(
        "       DEEP MIGRATION VERIFICATION"
    );
    console.log(
        "=========================================="
    );


    console.log(
        "\nReading source documents..."
    );


    const sourceDocuments =
        await getDatabaseDocuments(
            sourceDb
        );


    console.log(
        `Source documents: ${sourceDocuments.size}`
    );


    console.log(
        "\nReading destination documents..."
    );


    const destinationDocuments =
        await getDatabaseDocuments(
            destinationDb
        );


    console.log(
        `Destination documents: ${destinationDocuments.size}`
    );


    /*
     * Find missing documents.
     */

    const missing = [];


    for (
        const path
        of sourceDocuments.keys()
    ) {

        if (
            !destinationDocuments.has(path)
        ) {

            missing.push(path);
        }
    }


    /*
     * Find unexpected documents.
     */

    const extra = [];


    for (
        const path
        of destinationDocuments.keys()
    ) {

        if (
            !sourceDocuments.has(path)
        ) {

            extra.push(path);
        }
    }


    /*
     * Compare actual document data.
     */

    const mismatches = [];


    for (
        const [
            path,
            sourceData
        ]
        of sourceDocuments
    ) {

        if (
            !destinationDocuments.has(path)
        ) {

            continue;
        }


        const destinationData =
            destinationDocuments.get(path);


        if (
            !documentsAreEqual(
                sourceData,
                destinationData
            )
        ) {

            mismatches.push(path);
        }
    }


    const passed =
        missing.length === 0 &&
        extra.length === 0 &&
        mismatches.length === 0;


    console.log("\n");
    console.log(
        "=========================================="
    );
    console.log(
        "          VERIFICATION REPORT"
    );
    console.log(
        "=========================================="
    );


    console.log(
        `Source documents      : ${sourceDocuments.size}`
    );

    console.log(
        `Destination documents : ${destinationDocuments.size}`
    );

    console.log(
        `Missing documents     : ${missing.length}`
    );

    console.log(
        `Extra documents       : ${extra.length}`
    );

    console.log(
        `Data mismatches       : ${mismatches.length}`
    );


    if (missing.length > 0) {

        console.log(
            "\nMissing documents:"
        );

        for (const path of missing) {

            console.log(
                `  ${path}`
            );
        }
    }


    if (extra.length > 0) {

        console.log(
            "\nExtra documents:"
        );

        for (const path of extra) {

            console.log(
                `  ${path}`
            );
        }
    }


    if (mismatches.length > 0) {

        console.log(
            "\nDocuments with data mismatches:"
        );

        for (const path of mismatches) {

            console.log(
                `  ${path}`
            );
        }
    }


    console.log("\n");


    if (passed) {

        console.log(
            "VERIFICATION PASSED ✓"
        );

    } else {

        console.log(
            "VERIFICATION FAILED ✗"
        );
    }


    return {
        passed,

        sourceDocumentCount:
            sourceDocuments.size,

        destinationDocumentCount:
            destinationDocuments.size,

        missing,

        extra,

        mismatches
    };
}


module.exports = {
    verifyMigration
};