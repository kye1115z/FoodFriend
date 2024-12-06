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
  const username = req.session.username;
  const userId = req.session.userId;

  let sql = `SELECT calories, userId, mealType 
            FROM meals
            WHERE userId = ?`;
  try {
    let [mealData] = await conn.query(sql, [userId]);

    const mealTypeCalories = mealData.reduce((totals, meal) => {
      const { mealType, calories } = meal;
      if (!totals[mealType]) {
        totals[mealType] = 0;
      }
      totals[mealType] += calories;
      return totals;
    }, {});

    const totalCalories = {
      breakfast: mealTypeCalories.breakfast || 0,
      lunch: mealTypeCalories.lunch || 0,
      dinner: mealTypeCalories.dinner || 0,
    };

    res.render("home", { greeting, username, totalCalories });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving meal data.");
  }
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
    req.session.username = rows[0].username;
    req.session.userId = rows[0].userId;
    req.session.authenticated = true;
    res.status(200).send("Login successful!");
  } else {
    res.status(400).send("Invalid username or password.");
  }
});

// Meal Log Mainpage Get
app.get("/meallog", isAuthenticated, async (req, res) => {
  res.render("mealLog");
});

// /meallog/data
app.get("/meallog/data", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  let sql = `SELECT * FROM meals WHERE userId = ? ORDER BY eatingTime DESC`;

  try {
    let [mealData] = await conn.query(sql, [userId]);

    const mealsByType = mealData.reduce(
      (groupedMeals, meal) => {
        const { mealType } = meal;
        if (!groupedMeals[mealType]) {
          groupedMeals[mealType] = [];
        }
        groupedMeals[mealType].push(meal);
        return groupedMeals;
      },
      { breakfast: [], lunch: [], dinner: [] }
    );

    res.json({ mealsByType: mealsByType, userId: userId });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving meal data.");
  }
});

// Add Meal Get
app.get("/meallog-create", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  res.render("addMeal", { userId });
});

// Add Meal Post
app.post("/meallog-create", isAuthenticated, async (req, res) => {
  const {
    userId,
    menu_name,
    meal_photo,
    eating_date_year,
    eating_date_month,
    eating_date_day,
    eating_time_hour,
    eating_time_minute,
    time_format,
    kcal,
    mealType,
  } = req.body;

  try {
    let hour = parseInt(eating_time_hour);
    let minute = parseInt(eating_time_minute);

    if (time_format === "PM" && hour !== 12) {
      hour += 12;
    } else if (time_format === "AM" && hour === 12) {
      hour = 0;
    }

    const eatingTime = moment()
      .set({
        year: eating_date_year,
        month: eating_date_month - 1,
        date: eating_date_day,
        hour,
        minute,
        second: 0,
        millisecond: 0,
      })
      .format("YYYY-MM-DD HH:mm:ss");

    const sql = `INSERT INTO meals (menuName, mealPhoto, eatingTime, calories, mealType, userId) VALUES (?, ?, ?, ?, ?, ?)`;
    const sqlParams = [
      menu_name,
      meal_photo,
      eatingTime,
      kcal,
      mealType,
      userId,
    ];

    const conn = await pool.getConnection();
    await conn.query(sql, sqlParams);
    conn.release();

    res.status(200).send("Meal successfully added!");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while adding the meal.");
  }
});

// Edit Meal Get
app.get("/meallog-edit", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const mealId = req.query.mealId;

  try {
    let sql = `SELECT * 
            FROM meals
            WHERE id = ?`;
    let [mealData] = await conn.query(sql, [mealId]);

    const eatingTime = new Date(mealData[0].eatingTime);
    const hours = eatingTime.getHours();
    const minutes = eatingTime.getMinutes();
    const isPM = hours >= 12;
    const formattedHour = hours % 12 || 12;
    const formattedMinute = minutes < 10 ? `0${minutes}` : minutes;

    const timeFormat = isPM ? "PM" : "AM";

    res.render("editMeal", {
      userId,
      mealData: mealData[0],
      eatingTimeHour: formattedHour,
      eatingTimeMinute: formattedMinute,
      timeFormat: timeFormat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving meals data.");
  }
});

// Edit Meal Post
app.post("/meallog-edit", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  const {
    menu_name,
    meal_photo,
    eating_time_hour,
    eating_time_minute,
    time_format,
    kcal,
    mealType,
    mealId,
  } = req.body;

  try {
    let hour = parseInt(eating_time_hour);
    let minute = parseInt(eating_time_minute);

    if (time_format === "PM" && hour !== 12) {
      hour += 12;
    } else if (time_format === "AM" && hour === 12) {
      hour = 0;
    }

    const eatingTime = moment()
      .set({ hour, minute, second: 0, millisecond: 0 })
      .format("YYYY-MM-DD HH:mm:ss");

    const sql = `UPDATE meals 
      SET menuName = ?, mealPhoto = ?, eatingTime = ?, calories = ?, mealType = ? 
      WHERE id = ? AND userId = ?`;

    const sqlParams = [
      menu_name,
      meal_photo,
      eatingTime,
      kcal,
      mealType,
      mealId,
      userId,
    ];

    const conn = await pool.getConnection();
    const [result] = await conn.query(sql, sqlParams);
    conn.release();

    if (result.affectedRows > 0) {
      res.status(200).send("Meal successfully updated!");
    } else {
      res.status(400).send("No meal found to update or user mismatch.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the meal.");
  }
});

// Delete Meal Get
app.delete("/meallog-delete", isAuthenticated, async (req, res) => {
  const { mealId } = req.body; // 클라이언트에서 mealId를 전달받음

  if (!mealId) {
    return res.status(400).send("Meal ID is required");
  }

  try {
    const sql = "DELETE FROM meals WHERE id = ?";
    const [result] = await conn.query(sql, [mealId]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Meal not found");
    }

    res.send("Meal deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while deleting the meal.");
  }
});

// recipe main
app.get("/recipe", async (req, res) => {
  res.render("recipe");
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
