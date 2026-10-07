const express = require("express");

const {
    startMigration,
    getMigrationStatus
} = require("../services/migrationService");

const router = express.Router();


router.get("/status", (req, res) => {

    res.json({
        success: true,
        migration: getMigrationStatus()
    });

});


router.post("/start", (req, res) => {

    try {

        const migration =
            startMigration();


        res.status(202).json({

            success: true,

            message:
                "Migration started.",

            migration
        });


    } catch (error) {

        console.error(
            "Unable to start migration:",
            error
        );


        res.status(409).json({

            success: false,

            error:
                error.message,

            migration:
                getMigrationStatus()
        });
    }

});


module.exports = router;