import jwt from "jsonwebtoken";

const token = jwt.sign({ userId: "64dbf417-64a0-4020-b5ee-e73998822e95", role: "OWNER" }, "super-secret-access-key-change-in-prod", { expiresIn: "10y" });
console.log(token);
