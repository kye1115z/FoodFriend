document.getElementById("save_btn").addEventListener("click", async (event) => {
  event.preventDefault();

  const form = document.getElementById("add_menu");
  const formData = new FormData(form);

  try {
    const data = {
      menu_name: formData.get("menu_name"),
      meal_photo: formData.get("meal_photo"),
      eating_date_year: formData.get("eating_date_year"),
      eating_date_month: formData.get("eating_date_month"),
      eating_date_day: formData.get("eating_date_day"),
      eating_time_hour: formData.get("eating_time_hour"),
      eating_time_minute: formData.get("eating_time_minute"),
      time_format: formData.get("time_format"),
      kcal: formData.get("kcal"),
      mealType: formData.get("mealType"),
      userId: formData.get("userId"),
      mealId: formData.get("mealId"),
    };

    const response = await fetch("/meallog-edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const message = await response.text();
      alert(message);
      window.location.href = "/meallog";
    } else {
      const message = await response.text();
      alert(`Error: ${message}`);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while modifying the meal.");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const timeSelect = document.getElementById("time_format_select");
  const timeFormat = timeSelect.getAttribute("time-format");
  const timeOptions = timeSelect.querySelectorAll("option");
  timeOptions.forEach((option) => {
    if (option.value === timeFormat) {
      option.selected = true;
    }
  });

  const mealSelect = document.getElementById("meal_type_select");
  const mealFormat = mealSelect.getAttribute("meal-type");
  const mealOptions = mealSelect.querySelectorAll("option");
  mealOptions.forEach((option) => {
    if (option.value === mealFormat) {
      option.selected = true;
    }
  });
});
