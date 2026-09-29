const db = require("../config/sql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

 



exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const [exist] = await db.query(
    "SELECT * FROM user_data WHERE email=?",
    [email]
  );

  if (exist.length > 0) {
    return res.json({ message: "User exists" });
  
  }

  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    "INSERT INTO user_data (name,email,password_hash) VALUES (?,?,?)",
    [name, email, hash]
  );

  await db.query(
    "INSERT INTO profile (user_id) VALUES (?)",
    [result.insertId]
  );


  res.json({ message: "Registered" });
};



exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  

  const [rows] = await db.query(
    "SELECT * FROM user_data WHERE email=?",
    [email]
  );

  if (rows.length === 0) {
    return res.json({ message: "Invalid email" });
  }

  const user = rows[0];
  console.log("INPUT PASSWORD:", password);
console.log("DB HASH:", user.password_hash);

const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.json({ message: "Wrong password" });
  }

  const token = jwt.sign({ id: user.id }, "secret123");

  res.json({
    token,
    name: user.name,
    email: user.email,
  });
};


exports.getProfile = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.name, u.email, p.avtar_url, p.phone, p.address
     FROM user_data u
     LEFT JOIN profile p ON u.id = p.user_id
     WHERE u.id=?`,
    [req.user.id]
  );

  res.json(rows[0]);
};



exports.updateProfile = async (req, res) => {
  const { name, email, avtar_url, phone, address } = req.body;

  await db.query(
    "UPDATE user_data SET name=?, email=? WHERE id=?",
    [name, email, req.user.id]
  );

  await db.query(
    "UPDATE profile SET avtar_url=?, phone=?, address=? WHERE user_id=?",
    [avtar_url, phone, address, req.user.id]
  );

  res.json({ message: "Profile updated" });
};