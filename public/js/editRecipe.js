document.addEventListener("DOMContentLoaded", async () => {
  const ingredientsContainer = document.getElementById("ingredients_container");
  const addIngredientBtn = document.getElementById("add_ingredient_btn");
  const instructionsContainer = document.getElementById(
    "instructions_container"
  );
  const addStepBtn = document.getElementById("add_step_btn");

  const recipeId = document.getElementById("recipeId").value;

  async function fetchRecipeData(recipeId) {
    try {
      const response = await fetch(`/api/recipes-edit?recipeId=${recipeId}`);
      if (!response.ok) throw new Error("Failed to fetch recipe data");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching recipe data:", error);
      alert("Failed to load recipe data. Please try again later.");
      return { ingredients: [], instructions: [] };
    }
  }

  const createIngredientInput = (value = "") => {
    const ingredientInputGroup = document.createElement("div");
    ingredientInputGroup.className = "ingredient_input_group";
    ingredientInputGroup.innerHTML = `
            <input
              class="basic_input"
              name="recipe_ingredients[]"
              placeholder="Enter an ingredient"
              value="${value}"
              required
            />
            <button type="button" class="remove_ingredient">
              <img src="images/removeIcon.svg" alt="remove" />
            </button>
          `;
    ingredientsContainer.appendChild(ingredientInputGroup);

    const removeBtn = ingredientInputGroup.querySelector(".remove_ingredient");
    removeBtn.addEventListener("click", () => {
      ingredientInputGroup.remove();
    });
  };

  function addInstructionStep(
    value = "",
    stepNumber = instructionsContainer.children.length + 1
  ) {
    console.log(value);
    const newStep = document.createElement("div");
    newStep.className = "instruction_step";
    newStep.innerHTML = `
      <p>Step ${stepNumber}</p>
      <div class="instruction_box">
        <textarea
          class="basic_textarea"
          name="instruction_steps[]"
          placeholder="Enter step description"
          required
        >${value}</textarea>
        <button type="button" class="remove_step">
          <img src="images/removeIcon.svg" alt="remove" />
        </button>
      </div>
    `;
    instructionsContainer.appendChild(newStep);

    const removeBtn = newStep.querySelector(".remove_step");
    removeBtn.addEventListener("click", () => {
      newStep.remove();
      updateStepNumbers();
    });
  }

  function updateStepNumbers() {
    const steps = instructionsContainer.querySelectorAll(".instruction_step");
    steps.forEach((step, index) => {
      step.querySelector("p").textContent = `Step ${index + 1}`;
    });
  }

  async function initializeData(recipeId) {
    const { ingredients, instructions } = await fetchRecipeData(recipeId);

    ingredients.forEach((ingredient) => {
      createIngredientInput(ingredient);
    });

    instructions.forEach((instruction, index) => {
      addInstructionStep(instruction, index + 1);
    });
  }

  addIngredientBtn.addEventListener("click", () => {
    createIngredientInput();
  });

  addStepBtn.addEventListener("click", () => {
    addInstructionStep();
  });

  initializeData(recipeId);
});

// edit recipe post
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add_menu");
  const saveBtn = document.getElementById("save_btn");

  saveBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const recipeId = document.getElementById("recipeId").value;
    const recipeName = document.getElementById("recipe_name_input").value;
    const recipePhoto = document.getElementById("recipe_photo_input").value;
    const recipeDescription =
      document.getElementById("recipe_description").value;
    const recipeServings = document.getElementById("recipe_servings").value;
    const cookingTimeHour = document.getElementById("cooking_time_hour").value;
    const cookingTimeMinute = document.getElementById(
      "cooking_time_minute"
    ).value;

    // Get selected categories
    const recipeCategories = [];
    document
      .querySelectorAll('input[name="recipe_categories"]:checked')
      .forEach((checkbox) => {
        recipeCategories.push(checkbox.value);
      });

    const recipeAllergens = [];
    document
      .querySelectorAll('input[name="recipe_allergens"]:checked')
      .forEach((checkbox) => {
        recipeAllergens.push(checkbox.value);
      });

    const recipeIngredients = [];
    document
      .querySelectorAll('input[name="recipe_ingredients[]"]')
      .forEach((input) => {
        recipeIngredients.push(input.value);
      });

    const instructionSteps = [];
    document
      .querySelectorAll('textarea[name="instruction_steps[]"]')
      .forEach((textarea, index) => {
        const instructionId = textarea.dataset.instructionId || null;
        instructionSteps.push({
          instructionId: instructionId,
          description: textarea.value,
        });
      });

    const recipeData = {
      recipeId,
      recipe_name: recipeName,
      recipe_photo: recipePhoto,
      recipe_description: recipeDescription,
      recipe_servings: recipeServings,
      cooking_time_hour: cookingTimeHour,
      cooking_time_minute: cookingTimeMinute,
      recipe_categories: recipeCategories,
      recipe_allergens: recipeAllergens,
      recipe_ingredients: recipeIngredients,
      instruction_steps: instructionSteps,
    };

    try {
      const response = await fetch("/recipe-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Recipe updated successfully!");
        window.location.href = `/recipeDetails?recipeId=${recipeId}`;
      } else {
        alert("Failed to update recipe.");
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      alert(
        "An error occurred while updating the recipe. Please try again later."
      );
    }
  });
});
