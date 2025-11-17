require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const searchRoutes = require("./controllers/searchController");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ======= SERVE FRONTEND FILES =======
// This serves index.html, CSS, JS, images from the same folder
app.use(express.static(path.join(__dirname)));

// ======= API ROUTES =======
app.use("/api/search", searchRoutes);

// ======= FRONTEND CATCH-ALL =======
// Any unknown route should load index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});