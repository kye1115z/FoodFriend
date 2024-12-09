let recipeId = -1;
const modal = document.getElementById("modal");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const cancelBtn = document.getElementById("cancelBtn");

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("threedots_btn");
  if (button) {
    button.addEventListener("click", () => {
      recipeId = button.getAttribute("data-recipe-id");
      handleThreedots(recipeId);
    });
  } else {
    console.error("Button with ID 'threedots_btn' not found.");
  }
});

function handleThreedots(currentRecipeId) {
  recipeId = currentRecipeId;
  modal.style.display = "flex";
}

editBtn.addEventListener("click", () => {
  window.location.href = `/recipe-edit?recipeId=${recipeId}`;
  modal.style.display = "none";
});

deleteBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/recipe-delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipeId }),
    });

    if (response.ok) {
      const message = await response.text();
      alert(message);
      modal.style.display = "none";
      window.location.href = "/recipe";
    } else {
      const errorMessage = await response.text();
      alert(`Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while deleting the recipe.");
  }
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// toggle-save
document.getElementById("save_btn").addEventListener("click", async () => {
  const userId = document.querySelector("div[userId]").getAttribute("userId");
  const recipeid = document.getElementById("recipeId").getAttribute("recipeId");

  const isSaved = document
    .querySelector("#save_btn img")
    .src.includes("saveL_checked");
  const action = isSaved ? "remove" : "save";

  try {
    const response = await fetch("/toggle-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, recipeid, action }),
    });

    if (response.ok) {
      const imgElement = document.querySelector("#save_btn img");
      imgElement.src = isSaved
        ? "images/saveL.svg"
        : "images/saveL_checked.svg";
      window.location.reload();
    }
  } catch (error) {
    console.error("Error toggling save action:", error);
    alert("An error occurred while saving the recipe.");
  }
});
