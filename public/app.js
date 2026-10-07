async function getDatabaseInfo(type) {

    const response = await fetch(
        `/api/database/${type}`
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load ${type} database`
        );
    }

    return await response.json();
}


function displayDatabase(type, response) {

    console.log("TYPE:", type);
    console.log("RESPONSE:", response);

    const database = response.database;

    console.log("DATABASE:", database);
    console.log("COLLECTION COUNT:", database.collectionCount);

    document.getElementById(
        `${type}-collections`
    ).textContent = database.collectionCount;

    document.getElementById(
        `${type}-documents`
    ).textContent = database.documentCount;

    document.getElementById(
        `${type}-status`
    ).textContent =
        database.connected
            ? "● Connected"
            : "● Disconnected";


    const list = document.getElementById(
        `${type}-list`
    );

    list.innerHTML = "";


    for (const collection of database.collections) {

        const element =
            document.createElement("div");

        element.className = "collection";


        const name =
            document.createElement("span");

        name.textContent =
            collection.name;


        const count =
            document.createElement("strong");

        count.textContent =
            collection.documentCount;


        element.appendChild(name);
        element.appendChild(count);

        list.appendChild(element);
    }
}


async function loadDatabaseInformation() {

    console.log(
        "Loading database information..."
    );


    try {

        const source =
            await getDatabaseInfo("source");

        const destination =
            await getDatabaseInfo("destination");


        console.log(
            "Source:",
            source
        );

        console.log(
            "Destination:",
            destination
        );


        displayDatabase(
            "source",
            source
        );

        displayDatabase(
            "destination",
            destination
        );


    } catch (error) {

        console.error(
            "Database loading failed:",
            error
        );

        document.getElementById(
            "source-status"
        ).textContent =
            "Error";


        document.getElementById(
            "destination-status"
        ).textContent =
            "Error";


        alert(
            `Unable to load database information:\n${error.message}`
        );
    }
}


async function startMigration() {

    const confirmed =
        confirm(
            "Are you sure you want to start the migration?"
        );


    if (!confirmed) {
        return;
    }


    const button =
        document.getElementById(
            "migration-button"
        );


    button.disabled = true;

    button.textContent =
        "Migration Running...";


    try {

        const response =
            await fetch(
                "/api/migration/start",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to start migration"
            );
        }


        console.log(
            "Migration started:",
            result
        );


        updateMigrationStatus();

    } catch (error) {

        console.error(
            error
        );


        document.getElementById(
            "migration-status"
        ).textContent =
            "Migration status: FAILED";


        alert(
            error.message
        );


        button.disabled = false;

        button.textContent =
            "Start Migration";
    }
}

async function updateMigrationStatus() {

    try {

        const response =
            await fetch(
                "/api/migration/status"
            );


        const result =
            await response.json();


        const migration =
            result.migration;


        const statusElement =
            document.getElementById(
                "migration-status"
            );


        statusElement.textContent =
            `Migration status: ${migration.state}`;


        console.log(
            "Migration status:",
            migration
        );
        if (migration.verification) {

            displayVerification(
                migration.verification
            );
        }


        if (
            migration.state === "RUNNING"
        ) {

            updateMigrationProgress(
                migration
            );


            setTimeout(
                updateMigrationStatus,
                1000
            );

            return;
        }


        if (
            migration.state === "COMPLETED"
        ) {

            handleMigrationCompleted(
                migration
            );

            return;
        }


        if (
            migration.state ===
            "VERIFICATION_FAILED"
        ) {

            handleMigrationCompleted(
                migration
            );

            return;
        }


        if (
            migration.state ===
            "FAILED"
        ) {

            handleMigrationFailed(
                migration
            );

            return;
        }


    } catch (error) {

        console.error(
            "Status check failed:",
            error
        );

    }
}

function updateMigrationProgress(
    migration
) {

    const stats =
        migration.stats;


    const statusElement =
        document.getElementById(
            "migration-status"
        );


    statusElement.textContent =
        `Migration status: RUNNING | ` +
        `Collections: ${stats.collectionsProcessed} | ` +
        `Read: ${stats.documentsRead} | ` +
        `Written: ${stats.documentsWritten}`;
}

function handleMigrationCompleted(
    migration
) {

    const button =
        document.getElementById(
            "migration-button"
        );


    button.disabled = false;

    button.textContent =
        "Start Migration";


    if (
        migration.verificationPassed
    ) {

        document.getElementById(
            "migration-status"
        ).textContent =
            "Migration status: COMPLETED ✓";


        alert(
            "Migration completed successfully.\n\n" +
            "Verification passed."
        );


    } else {

        document.getElementById(
            "migration-status"
        ).textContent =
            "Migration status: VERIFICATION FAILED";


        alert(
            "Migration completed, but verification failed."
        );
    }


    // Refresh database information

    loadDatabaseInformation();
}

function handleMigrationFailed(
    migration
) {

    const button =
        document.getElementById(
            "migration-button"
        );


    button.disabled = false;

    button.textContent =
        "Start Migration";


    document.getElementById(
        "migration-status"
    ).textContent =
        "Migration status: FAILED";


    alert(
        `Migration failed:\n${migration.error}`
    );
}

function displayVerification(
    verification
) {

    const element =
        document.getElementById(
            "verification-result"
        );


    if (!verification) {

        element.innerHTML = "";

        return;
    }


    element.innerHTML = `
        <h3>
            Verification Report
        </h3>

        <div class="verification-grid">

            <div>
                <span>Source Documents</span>
                <strong>
                    ${verification.sourceDocumentCount}
                </strong>
            </div>

            <div>
                <span>Destination Documents</span>
                <strong>
                    ${verification.destinationDocumentCount}
                </strong>
            </div>

            <div>
                <span>Missing</span>
                <strong>
                    ${verification.missing.length}
                </strong>
            </div>

            <div>
                <span>Extra</span>
                <strong>
                    ${verification.extra.length}
                </strong>
            </div>

            <div>
                <span>Data Mismatches</span>
                <strong>
                    ${verification.mismatches.length}
                </strong>
            </div>

        </div>
    `;
}

// Start automatically when page loads

console.log(
    "app.js loaded successfully"
);

loadDatabaseInformation();