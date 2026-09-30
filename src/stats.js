const stats = {

    collectionsProcessed: 0,

    documentsRead: 0,

    documentsWritten: 0,

    documentsSkipped: 0,

    failures: 0
};


function printReport() {

    console.log("\n");
    console.log("==========================================");
    console.log("         FIRESTORE MIGRATION REPORT");
    console.log("==========================================");

    console.log(
        `Collections processed : ${stats.collectionsProcessed}`
    );

    console.log(
        `Documents read        : ${stats.documentsRead}`
    );

    console.log(
        `Documents written     : ${stats.documentsWritten}`
    );

    console.log(
        `Documents skipped     : ${stats.documentsSkipped}`
    );

    console.log(
        `Failures              : ${stats.failures}`
    );

    console.log("==========================================");
}


module.exports = {
    stats,
    printReport
};