const express = require("express");
const shivRouter = require("./routes/index");

const PORT = 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use("/", shivRouter);

app.listen(PORT, () => {
  console.log("Server Running on PORT: " + PORT);
});
