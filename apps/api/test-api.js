const jwt = require("jsonwebtoken");
const token = jwt.sign({ userId: "mock", role: "OWNER" }, process.env.JWT_SECRET || "default_secret_here");
console.log(token);
