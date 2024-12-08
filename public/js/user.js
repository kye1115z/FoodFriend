document.getElementById("save_btn").addEventListener("click", async () => {
  const form = document.getElementById("edit_user");
  const formData = new FormData(form);

  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  try {
    const response = await fetch("/user-edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Your information has been updated successfully!");
      window.location.href = "/user";
    } else {
      const error = await response.json();
      alert(`Error: ${error.message || "Failed to update information."}`);
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    alert("An error occurred while updating your information.");
  }
});
