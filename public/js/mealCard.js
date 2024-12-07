const breakfastContainer = document.getElementById("breakfast_container");
const lunchContainer = document.getElementById("lunch_container");
const dinnerContainer = document.getElementById("dinner_container");

function generateMealCards(meals, container) {
  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "meal_card";

    const formattedTime = new Date(meal.eatingTime).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    card.innerHTML = `
      <img src="${meal.mealPhoto}" alt="${meal.menuName}">
      <div class="meal_info">
        <div class="menu_name">${meal.menuName}</div>
        <div class="bottom_text">${formattedTime} | ${meal.calories} kcal</div>
      </div>
    `;

    container.prepend(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("/meallog/data")
    .then((response) => response.json())
    .then((data) => {
      generateMealCards(data.breakfast, breakfastContainer);
      generateMealCards(data.lunch, lunchContainer);
      generateMealCards(data.dinner, dinnerContainer);
    })
    .catch((error) => console.error("Error fetching meal data:", error));
});
