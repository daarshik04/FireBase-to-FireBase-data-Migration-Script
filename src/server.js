const express =require("express");
const path = require("path");

const databaseRoutes = require("./routes/databaseRoutes");
const migrationRoutes = require("./routes/migrationRoutes");

const app = express();
const PORT = 3000;

//Parse JSON request bodies
app.use(express.json());

//Server frontend
app.use(express.static(
    path.join(__dirname, "../public")
));

//Database API routes
app.use("/api/database", databaseRoutes);
app.use("/api/migration", migrationRoutes);

app.get("/api/health", (req,res)=>{
    res.json({
        status: "UP"
    });
});

app.listen(PORT, ()=>{
    console.log(
        'Firebase Migration Application running at http://localhost:${PORT}'
    );
});