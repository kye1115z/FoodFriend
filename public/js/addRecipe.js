document.addEventListener("DOMContentLoaded", () => {
  const ingredientsContainer = document.getElementById("ingredients_container");
  const addIngredientBtn = document.getElementById("add_ingredient_btn");

  // Add new ingredient input
  addIngredientBtn.addEventListener("click", () => {
    const newInputGroup = document.createElement("div");
    newInputGroup.className = "ingredient_input_group";
    newInputGroup.innerHTML = `
        <input
            class="basic_input"
            name="recipe_ingredients[]"
            placeholder="Enter an ingredient"
            required
        />
        <button type="button" class="remove_ingredient">
            <img src="images/removeIcon.svg" alt="remove" />
        </button>
      `;

    ingredientsContainer.appendChild(newInputGroup);

    // Attach remove functionality to the new button
    const removeBtn = newInputGroup.querySelector(".remove_ingredient");
    removeBtn.addEventListener("click", () => {
      newInputGroup.remove();
    });
  });

  // Handle initial remove buttons
  ingredientsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove_ingredient")) {
      event.target.closest(".ingredient_input_group").remove();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const instructionsContainer = document.getElementById(
    "instructions_container"
  );
  const addStepBtn = document.getElementById("add_step_btn");

  // Add new instruction step
  addStepBtn.addEventListener("click", () => {
    const stepCount =
      instructionsContainer.querySelectorAll(".instruction_step").length + 1;
    const newStep = document.createElement("div");
    newStep.className = "instruction_step";
    newStep.innerHTML = `
        <p>Step ${stepCount}</p>
        <textarea
          class="basic_textarea"
          name="instruction_steps[]"
          placeholder="Enter step description"
          required
        ></textarea>
        <button type="button" class="remove_step">
          <img src="images/removeIcon.svg" alt="remove" />
        </button>
      `;

    instructionsContainer.appendChild(newStep);

    // Attach remove functionality to the new button
    const removeBtn = newStep.querySelector(".remove_step");
    removeBtn.addEventListener("click", () => {
      newStep.remove();
      updateStepNumbers();
    });
  });

  // Handle initial remove buttons
  instructionsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove_step")) {
      event.target.closest(".instruction_step").remove();
      updateStepNumbers();
    }
  });

  // Update step numbers after deletion
  function updateStepNumbers() {
    const steps = instructionsContainer.querySelectorAll(".instruction_step");
    steps.forEach((step, index) => {
      step.querySelector("p").textContent = `Step ${index + 1}`;
    });
  }
});

// data fetch
document.getElementById("save_btn").addEventListener("click", async () => {
  const recipeName = document.getElementById("recipe_name_input").value;
  const recipePhoto = document.getElementById("recipe_photo_input").value;
  const recipeDescription = document.getElementById("recipe_description").value;
  const recipeServings = document.getElementById("recipe_servings").value;
  const cookingTimeHour =
    document.getElementById("cooking_time_hour").value || 0;
  const cookingTimeMinute =
    document.getElementById("cooking_time_minute").value || 0;

  const cookingTime = `${cookingTimeHour}h ${cookingTimeMinute}m`;

  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="recipe_categories"]:checked')
  ).map((el) => el.value);

  const selectedAllergens = Array.from(
    document.querySelectorAll('input[name="recipe_allergens"]:checked')
  ).map((el) => el.value);
  const ingredients = Array.from(
    document.querySelectorAll('input[name="recipe_ingredients[]"]')
  ).map((el) => el.value);
  const instructions = Array.from(
    document.querySelectorAll('textarea[name="instruction_steps[]"]')
  ).map((el) => el.value);

  // Prepare data for POST request
  const data = {
    userId: document.querySelector('input[name="userId"]').value,
    recipe_name: recipeName,
    recipe_photo: recipePhoto,
    recipe_description: recipeDescription,
    recipe_servings: recipeServings,
    cooking_time: cookingTime,
    recipe_categories: selectedCategories,
    recipe_allergens: selectedAllergens,
    recipe_ingredients: ingredients,
    instruction_steps: instructions,
  };

  try {
    const response = await fetch("/recipe-create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (result.success) {
      alert("Recipe saved successfully!");
    } else {
      alert("Failed to save recipe!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while saving the recipe.");
  }
});
