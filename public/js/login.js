document
  .querySelector(".login_form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.querySelector("#username_input").value;
    const password = document.querySelector("#password_input").value;

    if (!username || !password) {
      alert("Both username and password must be filled out.");
      return;
    }

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const result = await response.text();

    if (response.status === 200) {
      window.location.href = "/";
    } else {
      alert(result);
    }
  });

// when clicking input field
document.querySelectorAll(".input_box input").forEach((input) => {
  input.addEventListener("focus", function () {
    this.closest(".input_box").style.borderBottom = "2px solid #3CB371";

    const img = this.closest(".input_box").querySelector("img");
    const imgSrc = img.getAttribute("src");
    img.setAttribute("src", imgSrc.replace(".svg", "_active.svg"));
  });

  input.addEventListener("blur", function () {
    this.closest(".input_box").style.borderBottom = "none";

    const img = this.closest(".input_box").querySelector("img");
    const imgSrc = img.getAttribute("src");
    img.setAttribute("src", imgSrc.replace("_active.svg", ".svg"));
  });
});
