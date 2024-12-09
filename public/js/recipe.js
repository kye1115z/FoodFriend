async function fetchRecipesByCategory(categoryId = "all") {
  console.log("Fetching recipes for category:", categoryId);
  try {
    const response = await fetch(`/recipe-search?categoryId=${categoryId}`);
    const data = await response.json();

    if (data.success) {
      const recipesContainer = document.getElementById("recipes_container");
      recipesContainer.innerHTML = "";

      data.recipes.forEach((recipe) => {
        const card = document.createElement("button");
        card.className = "recipe_card";

        card.addEventListener("click", () => {
          window.location.href = `/recipeDetails?recipeId=${recipe.recipeId}`;
        });

        card.innerHTML = `
          <img src="${recipe.imageUrl}" alt="${recipe.name}">
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

        const saveButton = card.querySelector(".save_button");
        const saveIcon = saveButton.querySelector("img");

        saveButton.addEventListener("click", async (event) => {
          event.stopPropagation();
          const userId = document
            .getElementById("hidden_userId")
            .getAttribute("userId");
          const recipeId = recipe.recipeId;

          const isSaved = saveIcon.src.includes("save_checked");
          const action = isSaved ? "remove" : "save";

          try {
            const res = await fetch("/toggle-save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId, recipeId, action }),
            });

            if (res.ok) {
              saveIcon.src = isSaved
                ? "/images/save.svg"
                : "/images/save_checked.svg";
              window.location.reload();
            } else {
              alert("Error saving the recipe.");
            }
          } catch (error) {
            console.error("Error handling save action:", error);
            alert("An error occurred while saving the recipe.");
          }
        });

        recipesContainer.appendChild(card);
      });
    } else {
      console.error("Failed to fetch recipes");
    }
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}

async function fetchCategories() {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();

    const categorySection = document.getElementById("category_section");

    const allButton = document.querySelector("#category_all");
    allButton.classList.add("active");
    allButton.addEventListener("click", () => {
      document
        .querySelectorAll(".category_button")
        .forEach((btn) => btn.classList.remove("active"));
      allButton.classList.add("active");
      document.querySelector(".category_span").innerText = "All";
      fetchRecipesByCategory("all");
    });

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.classList.add("category_button");
      button.id = category.id;
      button.innerText = category.name;

      button.addEventListener("click", () => {
        document
          .querySelectorAll(".category_button")
          .forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        document.querySelector(".category_span").innerText = category.name;
        fetchRecipesByCategory(category.id);
      });

      categorySection.appendChild(button);
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

fetchCategories();
