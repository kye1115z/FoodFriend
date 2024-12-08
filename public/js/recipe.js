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

      fetchRecipes("all");
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
        fetchRecipes(category.id);
      });

      categorySection.appendChild(button);
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

fetchCategories();

async function fetchRecipes(categoryId = "all") {
  try {
    const response = await fetch(`/recipe-search?categoryId=${categoryId}`);
    const data = await response.json();

    if (data.success) {
      const recipesContainer = document.getElementById("recipes_container");
      recipesContainer.innerHTML = "";

      data.recipes.forEach((recipe) => {
        const card = document.createElement("div");
        card.className = "recipe_card";
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

        recipesContainer.appendChild(card);
      });
    } else {
      console.error("Failed to fetch recipes");
    }
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}
