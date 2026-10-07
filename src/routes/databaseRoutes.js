const express = require("express");

const{
    getSourceInfo,
    getDestinationInfo
} = require("../services/databaseInfo");

const router = express.Router();

router.get("/source", async (req, res)=>{

    try{

        const info = await getSourceInfo();

        res.json({
            sucess:true,
            database:info 
        });
    }catch(error) {
        console.error(
            "Source database error:",
            error 
        );
        res.status(500).json({
            sucess:false,
            error:"Unable to read source database"
        });
    }
});

router.get("/destination", async (req, res)=>{

    try{
        const info = await getDestinationInfo();

        res.json({
            success: true,
            database:info
        });
    }catch(error){
        console.error(
            "Destination database error:",
            error
        );
        res.status(500).json({
            success: false,
            error: "Unable to read destination database"
        });
    }
});

module.exports = router;