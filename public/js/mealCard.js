let userId = -1;
let mealId = -1;
const breakfastContainer = document.getElementById("breakfast_container");
const lunchContainer = document.getElementById("lunch_container");
const dinnerContainer = document.getElementById("dinner_container");

const modal = document.getElementById("modal");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const cancelBtn = document.getElementById("cancelBtn");

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
    <div class="top_info">
    <div class="menu_name">${meal.menuName}</div>
    <button class="threedots_box" onClick="handleThreedots(${meal.id})"></button>
    </div>
    <div class="bottom_text">${formattedTime} | ${meal.calories} kcal</div>
    </div>
    `;

    container.prepend(card);
  });
}

function handleThreedots(currentMealId) {
  mealId = currentMealId;
  modal.style.display = "flex";
}

editBtn.addEventListener("click", () => {
  window.location.href = `/meallog-edit?mealId=${mealId}`;
  modal.style.display = "none";
});

deleteBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/meallog-delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mealId }),
    });

    if (response.ok) {
      const message = await response.text();
      alert(message);
      modal.style.display = "none";
      window.location.reload();
    } else {
      const errorMessage = await response.text();
      alert(`Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while deleting the meal.");
  }
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  fetch(`/meallog/data?date=${todayString}`)
    .then((response) => response.json())
    .then((data) => {
      userId = data.userId;

      generateMealCards(data.mealsByType.breakfast, breakfastContainer);
      generateMealCards(data.mealsByType.lunch, lunchContainer);
      generateMealCards(data.mealsByType.dinner, dinnerContainer);
    })
    .catch((error) => console.error("Error fetching meal data:", error));
});

function fetchMealsByDate(dateString) {
  const breakfastAddItem = breakfastContainer.querySelector(".add_card");
  const lunchAddItem = lunchContainer.querySelector(".add_card");
  const dinnerAddItem = dinnerContainer.querySelector(".add_card");

  breakfastContainer.innerHTML = "";
  lunchContainer.innerHTML = "";
  dinnerContainer.innerHTML = "";

  breakfastContainer.appendChild(breakfastAddItem);
  lunchContainer.appendChild(lunchAddItem);
  dinnerContainer.appendChild(dinnerAddItem);

  fetch(`/meallog/data?date=${dateString}`)
    .then((response) => response.json())
    .then((data) => {
      userId = data.userId;

      generateMealCards(data.mealsByType.breakfast, breakfastContainer);
      generateMealCards(data.mealsByType.lunch, lunchContainer);
      generateMealCards(data.mealsByType.dinner, dinnerContainer);
    })
    .catch((error) => console.error("Error fetching meal data:", error));
}
