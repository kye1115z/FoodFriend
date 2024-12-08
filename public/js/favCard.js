const container = document.getElementById("recipes_container");

async function fetchRecipes() {
  try {
    const response = await fetch("/api/recipes");

    if (!response.ok) {
      throw new Error("Failed to fetch recipes");
    }

    const recipes = await response.json();

    const filteredRecipes = recipes.filter((recipe) => recipe.saved);

    filteredRecipes.forEach((recipe) => {
      const card = document.createElement("button");
      card.className = "recipe_card";

      card.addEventListener("click", () => {
        window.location.href = `/recipeDetails?recipeId=${recipe.recipeId}`;
      });

      card.innerHTML = `
          <img src="${recipe.image}" alt="${recipe.name}">
          <button class="save_button">
            <img src="${
              recipe.saved ? "images/save_checked.svg" : "images/save.svg"
            }" alt="Save">  
          </button>
          <div class="recipe_info">
            <div class="recipe_left">
              <div class="recipe_name">${recipe.menuName}</div>
              <div class="recipe_desc">${recipe.servings} servings | ${
        recipe.cookingTime
      }</div>
            </div>
            <div class="profile">
              <img src="images/profileExSm.svg" alt="Profile">
            </div>
          </div>
        `;

      // save button
      const saveButton = card.querySelector(".save_button");
      saveButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        const userId = document
          .querySelector("div[userId]")
          .getAttribute("userId");
        const recipeId = recipe.recipeId;

        const isSaved = event.target.src.includes("save_checked");
        const action = isSaved ? "remove" : "save";

        try {
          const res = await fetch("/toggle-save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, recipeId, action }),
          });

          const data = await res.json();

          if (res.ok) {
            const imgElement = event.target;
            imgElement.src = isSaved
              ? "images/save.svg"
              : "images/save_checked.svg";
          }
        } catch (error) {
          console.error("Error handling save action:", error);
          alert("An error occurred while saving the recipe.");
        }
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}

fetchRecipes();
