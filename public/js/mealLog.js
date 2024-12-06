const calendar = document.querySelector(".calendar");
const daysContainer = calendar.querySelector(".days");
const leftArrow = calendar.querySelector(".arrow.left");
const rightArrow = calendar.querySelector(".arrow.right");

const addItemBtn = document.querySelector(".add_card");

function getWeekDates(baseDate) {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push({
      weekday: date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      date: date.getDate(),
      fullDate: date,
    });
  }
  return weekDates;
}

// Helper function: 캘린더 렌더링
function renderCalendar(baseDate) {
  const weekDates = getWeekDates(baseDate);
  const today = new Date();
  daysContainer.innerHTML = "";

  weekDates.forEach((day, index) => {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");

    if (day.fullDate.toDateString() === today.toDateString()) {
      dayDiv.classList.add("active");
    }

    dayDiv.addEventListener("click", () => {
      document
        .querySelectorAll(".day")
        .forEach((d) => d.classList.remove("selected"));
      dayDiv.classList.add("selected");
      console.log(`Selected date: ${day.fullDate.toDateString()}`);
    });

    dayDiv.innerHTML = `
        <span class="weekday">${day.weekday}</span>
        <span class="date">${day.date}</span>
      `;

    daysContainer.appendChild(dayDiv);
  });
}

let currentBaseDate = new Date();

renderCalendar(currentBaseDate);

leftArrow.addEventListener("click", () => {
  currentBaseDate.setDate(currentBaseDate.getDate() - 7);
  renderCalendar(currentBaseDate);
});

rightArrow.addEventListener("click", () => {
  currentBaseDate.setDate(currentBaseDate.getDate() + 7);
  renderCalendar(currentBaseDate);
});

// Add Item
addItemBtn.addEventListener("click", () => {
  window.location.href = "/meallog-create";
});
