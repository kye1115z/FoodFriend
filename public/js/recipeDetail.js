let recipeId = -1;
const modal = document.getElementById("modal");
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
const cancelBtn = document.getElementById("cancelBtn");

document.getElementById("threedots_btn").addEventListener("click", (event) => {
  recipeId = event.target.getAttribute("data-recipe-id");
  handleThreedots(recipeId);
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
      window.location.reload();
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
