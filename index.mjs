import express, { query } from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import moment from "moment-timezone";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const pool = mysql.createPool({
  host: "3.133.12.47",
  user: "yeeun",
  password: "cst336",
  database: "foodfriend_app",
  connectionLimit: 10,
  waitForConnections: true,
});
const conn = await pool.getConnection();

//initializing sessions
app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.authenticated || false;
  next();
});

app.get("/", async (req, res) => {
  const greeting = getGreeting();
  res.render("home", { greeting });
});

// // logout
app.get("/logout", isAuthenticated, async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Failed to logout.");
    }
    res.redirect("/");
  });
});

// // signup get
app.get("/signup", async (req, res) => {
  res.render("signup");
});

// signup post
app.post("/signup", async (req, res) => {
  const { username, firstname, lastname, email, password, repassword } =
    req.body;

  if (password !== repassword) {
    return res.status(400).send("Passwords do not match.");
  }

  try {
    let sql = `SELECT * FROM admin WHERE username = ? OR email = ?`;
    let sqlParams = [username, email];
    const [rows] = await conn.query(sql, sqlParams);

    if (rows.length > 0) {
      return res.status(400).send("Username or email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    sql = `INSERT INTO admin (username, firstName, lastName, email, password) VALUES (?, ?, ?, ?, ?)`;
    sqlParams = [username, firstname, lastname, email, hashedPassword];
    await conn.query(sql, sqlParams);

    res.status(201).send("User created successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during signup.");
  }
});

// // login get
app.get("/login", async (req, res) => {
  res.render("login");
});

// login post
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passwordHash = ``;

  let sql = `SELECT * 
            FROM admin 
            WHERE username = ?`;
  let sqlParams = [username];
  const [rows] = await conn.query(sql, sqlParams);
  if (rows.length > 0) {
    passwordHash = rows[0].password;
  } else {
    return res.status(400).send("Invalid username or password.");
  }

  const match = await bcrypt.compare(password, passwordHash);

  if (match) {
    req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
    req.session.authenticated = true;
    res.status(200).send("Login successful!");
  } else {
    res.status(400).send("Invalid username or password.");
  }
});

// Middleware
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/");
  }
}

// function
function getGreeting() {
  const currentTime = moment.tz("America/Los_Angeles");
  const hour = currentTime.hour();

  if (hour >= 6 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 18) {
    return "Good Afternoon";
  } else if (hour >= 18 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
}

// db
app.get("/dbTest", async (req, res) => {
  let sql = "SELECT CURDATE()";
  const [rows] = await conn.query(sql);
  res.send(rows);
}); //dbTest

app.listen(10040, "0.0.0.0", () => {
  console.log("Express server running");
});
