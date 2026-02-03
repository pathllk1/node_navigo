import express from "express";
import { countries } from "../../data/countries.js";

const router = express.Router();

// GET /countries
router.get("/countries", (req, res) => {
  res.json(countries);
});

export default router;
