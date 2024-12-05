const recipes = [
  {
    image: "https://via.placeholder.com/250x150",
    name: "Avocado Egg Toast",
    rating: 4.5,
    profile: "https://via.placeholder.com/30",
    saved: false,
  },
  {
    image: "https://via.placeholder.com/250x150",
    name: "Cafe Latte",
    rating: 5.0,
    profile: "https://via.placeholder.com/30",
    saved: true,
  },
  {
    image: "https://via.placeholder.com/250x150",
    name: "Eggs in Hell",
    rating: 5.0,
    profile: "https://via.placeholder.com/30",
    saved: false,
  },
  // Add more recipes here
];

const container = document.getElementById("recipes_container");

// Function to generate recipe cards
recipes.forEach((recipe) => {
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
          <div class="recipe_name">${recipe.name}</div>
          <div class="rating">★ ${recipe.rating}</div>
        </div>
        <div class="profile">
          <img src="images/profileExSm.svg" alt="Profile">
        </div>
      </div>
    `;

  container.appendChild(card);
});
