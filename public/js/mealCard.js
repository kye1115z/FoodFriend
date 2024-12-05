const meals = [
  {
    image: "https://via.placeholder.com/250x150",
    name: "Avocado Egg Toast",
    eatingTime: "08:30AM",
    kcal: 100,
  },
  {
    image: "https://via.placeholder.com/250x150",
    name: "Cafe Latte",
    eatingTime: "08:30AM",
    kcal: 100,
  },
  {
    image: "https://via.placeholder.com/250x150",
    name: "Eggs in Hell",
    eatingTime: "08:30AM",
    kcal: 100,
  },
  // Add more recipes here
];

const container = document.getElementById("meals_container");

// Function to generate recipe cards
meals.forEach((meal) => {
  const card = document.createElement("div");
  card.className = "meal_card";

  card.innerHTML = `
        <img src="${meal.image}" alt="${meal.name}">
        <div class="meal_info">
            <div class="menu_name">${meal.name}</div>
            <div class="bottom_text">${meal.eatingTime} | ${meal.kcal} kcal</div>
        </div>
      `;

  container.prepend(card);
});
