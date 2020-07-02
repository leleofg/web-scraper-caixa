const express = require("express");
const router = express.Router();
const scraper = require("../controller/scraper");

router.get("/", (req, res) => {
  res.render("login");
});

router.post("/", async (req, res) => {
  let result = {};

  try {
    result = await scraper.scrape(req.body.user, req.body.password);
    res.render("home", { result });
  } catch (error) {
    res.render("login", { error: "Credenciais inválidas" });
  }
});

module.exports = router;
