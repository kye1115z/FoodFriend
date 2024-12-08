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
  const { mealId } = req.body;

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

app.get("/recipeDetails", isAuthenticated, async (req, res) => {
  const recipeId = req.query.recipeId;
  const username = req.session.username;

  try {
    let sql = `SELECT * FROM recipes WHERE recipeId = ?`;
    let image_sql = `SELECT * FROM recipe_images WHERE recipeId = ?`;
    let allergen_sql = `SELECT * FROM recipe_allergens WHERE recipeId = ?`;
    let category_sql = `SELECT * FROM recipe_categories WHERE recipeId = ?`;
    let ingredient_sql = `SELECT * FROM recipe_ingredients WHERE recipeId = ?`;
    let instruction_sql = `SELECT * FROM recipe_instructions WHERE recipeId = ?`;

    const [recipe] = await conn.query(sql, [recipeId]);
    const [images] = await conn.query(image_sql, [recipeId]);
    const [allergens] = await conn.query(allergen_sql, [recipeId]);
    const [categories] = await conn.query(category_sql, [recipeId]);
    const [ingredients] = await conn.query(ingredient_sql, [recipeId]);
    const [instructions] = await conn.query(instruction_sql, [recipeId]);

    const allergenNames = await conn.query(
      `SELECT name FROM allergens WHERE id IN (?)`,
      [allergens.map((a) => a.allergenId)]
    );
    const categoryNames = await conn.query(
      `SELECT name FROM categories WHERE id IN (?)`,
      [categories.map((c) => c.categoryId)]
    );

    const recipeDetails = {
      ...recipe[0],
      image: images.length > 0 ? images[0].imageUrl : null,
      allergens: allergenNames[0].map((a) => a.name),
      categories: categoryNames[0].map((c) => c.name),
      ingredients: ingredients.map((ingredient) => ingredient.ingredient),
      instructions: instructions.map((instruction) => instruction.description),
    };

    res.render("recipeDetail", { recipe: recipeDetails, username: username });
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const sql = "SELECT * FROM categories ORDER BY name";
    const [categories] = await conn.query(sql);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/recipes", async (req, res) => {
  const userId = req.session.userId;
  try {
    let sql = `SELECT * FROM recipes`;
    let image_sql = `SELECT * FROM recipe_images`;
    let favorites_sql = `SELECT * FROM favorites WHERE userId = ?`;
    let allergen_sql = `SELECT * FROM recipe_allergens`;
    let category_sql = `SELECT * FROM recipe_categories`;
    let ingredient_sql = `SELECT * FROM recipe_ingredients`;
    let instruction_sql = `SELECT * FROM recipe_instructions`;

    const [recipes] = await conn.query(sql);
    const [images] = await conn.query(image_sql);
    const [favorites] = await conn.query(favorites_sql, [userId]);
    const [allergens] = await conn.query(allergen_sql);
    const [categories] = await conn.query(category_sql);
    const [ingredients] = await conn.query(ingredient_sql);
    const [instructions] = await conn.query(instruction_sql);

    const favoriteRecipeIds = favorites.map((favorite) => favorite.recipeId);

    const recipesWithDetails = recipes.map((recipe) => {
      const recipeImage = images.find(
        (img) => img.recipeId === recipe.recipeId
      );
      const recipeAllergens = allergens
        .filter((allergen) => allergen.recipeId === recipe.recipeId)
        .map((allergen) => allergen.allergen);
      const recipeCategories = categories
        .filter((category) => category.recipeId === recipe.recipeId)
        .map((category) => category.category);
      const recipeIngredients = ingredients
        .filter((ingredient) => ingredient.recipeId === recipe.recipeId)
        .map((ingredient) => ingredient.ingredient);
      const recipeInstructions = instructions
        .filter((instruction) => instruction.recipeId === recipe.recipeId)
        .map((instruction) => instruction.instruction);

      return {
        ...recipe,
        image: recipeImage ? recipeImage.imageUrl : null,
        saved: favoriteRecipeIds.includes(recipe.recipeId),
        allergens: recipeAllergens,
        categories: recipeCategories,
        ingredients: recipeIngredients,
        instructions: recipeInstructions,
      };
    });

    res.json(recipesWithDetails);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/recipes-edit", isAuthenticated, async (req, res) => {
  const recipeId = req.query.recipeId;

  try {
    let ingredient_sql = `SELECT * FROM recipe_ingredients WHERE recipeId = ?`;
    let instruction_sql = `SELECT * FROM recipe_instructions WHERE recipeId = ?`;

    const [ingredients] = await conn.query(ingredient_sql, [recipeId]);
    const [instructions] = await conn.query(instruction_sql, [recipeId]);

    const recipeIngredients = ingredients.map(
      (ingredient) => ingredient.ingredient
    );
    const recipeInstructions = instructions.map(
      (instruction) => instruction.description
    );

    const recipeDetails = {
      ingredients: recipeIngredients,
      instructions: recipeInstructions,
    };

    res.json(recipeDetails);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Internal Server Error");
  }
});

// recipe search
app.get("/recipe-search", async (req, res) => {
  const { categoryId } = req.query;
  try {
    let sql = `
      SELECT recipes.recipeId, recipes.menuName, recipes.servings, recipes.cookingTime, recipe_images.imageUrl
      FROM recipes
      LEFT JOIN recipe_categories ON recipes.recipeId = recipe_categories.recipeId
      LEFT JOIN recipe_images ON recipes.recipeId = recipe_images.recipeId
    `;

    if (categoryId && categoryId !== "all") {
      sql += ` WHERE recipe_categories.categoryId = ?`;
    }

    const [recipes] =
      categoryId && categoryId !== "all"
        ? await conn.query(sql, [categoryId])
        : await conn.query(sql);

    res.json({ success: true, recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Add Recipe Get
app.get("/recipe-create", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    let category_sql = `SELECT * FROM categories ORDER BY name`;
    let allergen_sql = `SELECT * FROM allergens ORDER BY name`;
    const [categories] = await conn.query(category_sql);
    const [allergens] = await conn.query(allergen_sql);

    res.render("addRecipe", { userId, categories, allergens });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add Recipe Post
app.post("/recipe-create", async (req, res) => {
  const {
    userId,
    recipe_name,
    recipe_photo,
    recipe_description,
    recipe_servings,
    cooking_time,
    recipe_categories,
    recipe_allergens,
    recipe_ingredients,
    instruction_steps,
  } = req.body;

  try {
    const [recipeResult] = await conn.query(
      "INSERT INTO recipes (menuName, description, servings, cookingTime, createdBy) VALUES (?, ?, ?, ?, ?)",
      [recipe_name, recipe_description, recipe_servings, cooking_time, userId]
    );
    const recipeId = recipeResult.insertId;

    await conn.query(
      "INSERT INTO recipe_images (recipeId, imageUrl) VALUES (?, ?)",
      [recipeId, recipe_photo]
    );

    for (const category of recipe_categories) {
      await conn.query(
        "INSERT INTO recipe_categories (recipeId, categoryId) VALUES (?, ?)",
        [recipeId, category]
      );
    }

    for (const allergen of recipe_allergens) {
      await conn.query(
        "INSERT INTO recipe_allergens (recipeId, allergenId) VALUES (?, ?)",
        [recipeId, allergen]
      );
    }

    for (const ingredient of recipe_ingredients) {
      await conn.query(
        "INSERT INTO recipe_ingredients (recipeId, ingredient) VALUES (?, ?)",
        [recipeId, ingredient]
      );
    }

    let stepOrder = 1;
    for (const step of instruction_steps) {
      await conn.query(
        "INSERT INTO recipe_instructions (recipeId, stepOrder, description) VALUES (?, ?, ?)",
        [recipeId, stepOrder++, step]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error inserting recipe:", err);
    res.status(500).json({ success: false, error: "Failed to save recipe" });
  } finally {
    conn.release();
  }
});

// Edit Recipe
app.get("/recipe-edit", isAuthenticated, async (req, res) => {
  const recipeId = req.query.recipeId;
  const userId = req.session.userId;

  try {
    let sql = `SELECT * FROM recipes WHERE recipeId = ?`;
    let image_sql = `SELECT * FROM recipe_images WHERE recipeId = ?`;
    let favorites_sql = `SELECT * FROM favorites WHERE recipeId = ? AND userId = ?`;
    let allergen_sql = `SELECT * FROM recipe_allergens WHERE recipeId = ?`;
    let category_sql = `SELECT * FROM recipe_categories WHERE recipeId = ?`;
    let ingredient_sql = `SELECT * FROM recipe_ingredients WHERE recipeId = ?`;
    let instruction_sql = `SELECT * FROM recipe_instructions WHERE recipeId = ?`;

    const [recipe] = await conn.query(sql, [recipeId]);
    const [images] = await conn.query(image_sql, [recipeId]);
    const [favorites] = await conn.query(favorites_sql, [recipeId, userId]);
    const [allergens] = await conn.query(allergen_sql, [recipeId]);
    const [categories] = await conn.query(category_sql, [recipeId]);
    const [ingredients] = await conn.query(ingredient_sql, [recipeId]);
    const [instructions] = await conn.query(instruction_sql, [recipeId]);

    const [allAllergens] = await conn.query("SELECT * FROM allergens");
    const [allCategories] = await conn.query("SELECT * FROM categories");

    const recipeDetails = {
      ...recipe[0],
      image: images.length > 0 ? images[0].imageUrl : null,
      saved: favorites.length > 0,
      allergens: allergens,
      categories: categories,
      ingredients: ingredients.map((ingredient) => ingredient.ingredient),
      instructions: instructions.map((instruction) => instruction.description),
      allAllergens: allAllergens,
      allCategories: allCategories,
    };

    res.render("editRecipe", { recipe: recipeDetails });
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Internal Server Error");
  }
});

// edit recipe post
app.post("/recipe-edit", async (req, res) => {
  const {
    recipeId,
    recipe_name,
    recipe_photo,
    recipe_description,
    recipe_servings,
    cooking_time_hour,
    cooking_time_minute,
    recipe_categories,
    recipe_allergens,
    recipe_ingredients,
    instruction_steps,
  } = req.body;

  const cooking_time = `${cooking_time_hour}h ${cooking_time_minute}m`;

  try {
    await conn.query(
      "UPDATE recipes SET menuName = ?, description = ?, servings = ?, cookingTime = ? WHERE recipeId = ?",
      [recipe_name, recipe_description, recipe_servings, cooking_time, recipeId]
    );

    await conn.query(
      "UPDATE recipe_images SET imageUrl = ? WHERE recipeId = ?",
      [recipe_photo, recipeId]
    );

    await conn.query("DELETE FROM recipe_categories WHERE recipeId = ?", [
      recipeId,
    ]);
    for (const category of recipe_categories) {
      await conn.query(
        "INSERT INTO recipe_categories (recipeId, categoryId) VALUES (?, ?)",
        [recipeId, category]
      );
    }

    await conn.query("DELETE FROM recipe_allergens WHERE recipeId = ?", [
      recipeId,
    ]);
    for (const allergen of recipe_allergens) {
      await conn.query(
        "INSERT INTO recipe_allergens (recipeId, allergenId) VALUES (?, ?)",
        [recipeId, allergen]
      );
    }

    await conn.query("DELETE FROM recipe_ingredients WHERE recipeId = ?", [
      recipeId,
    ]);
    for (const ingredient of recipe_ingredients) {
      await conn.query(
        "INSERT INTO recipe_ingredients (recipeId, ingredient) VALUES (?, ?)",
        [recipeId, ingredient]
      );
    }

    await conn.query("DELETE FROM recipe_instructions WHERE recipeId = ?", [
      recipeId,
    ]);

    let stepOrder = 1;
    for (const step of instruction_steps) {
      if (step.instructionId) {
        await conn.query(
          "UPDATE recipe_instructions SET stepOrder = ?, description = ? WHERE instructionId = ? AND recipeId = ?",
          [stepOrder++, step.description, step.instructionId, recipeId]
        );
      } else {
        await conn.query(
          "INSERT INTO recipe_instructions (recipeId, stepOrder, description) VALUES (?, ?, ?)",
          [recipeId, stepOrder++, step.description]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).json({ success: false, error: "Failed to update recipe" });
  } finally {
    conn.release();
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
