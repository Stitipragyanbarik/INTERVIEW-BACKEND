import express from "express";

const router = express.Router();

router.get("/working", (req, res) => {
  res.send("Hello, we are working!");
});

router.get("/health", (req, res) => {
  res.send("Server is healthy and responding!");
});

export default router;
