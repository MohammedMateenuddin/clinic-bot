require("dotenv").config();

const express = require("express");
const { handleWebhook } = require("./src/webhook");
const { startSchedulers } = require("./src/scheduler");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/webhook", handleWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`clinic-bot listening on port ${PORT}`);
  startSchedulers();
});
