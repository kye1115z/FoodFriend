document
  .querySelector(".signup_form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const password = document.querySelector("#password_input").value;
    const repassword = document.querySelector("#repassword_input").value;
    const username = document.querySelector("#username_input").value;
    const email = document.querySelector("#email_input").value;
    const firstname = document.querySelector("#firstname_input").value;
    const lastname = document.querySelector("#lastname_input").value;

    if (
      !username ||
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !repassword
    ) {
      alert("All fields must be filled out.");
      return;
    }

    if (password !== repassword) {
      alert("Passwords do not match.");
      return;
    }

    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        firstname,
        lastname,
        email,
        password,
        repassword,
      }),
    });

    const result = await response.text();

    if (response.status !== 201) {
      alert(result);
    } else {
      alert(result);
      window.location.href = "/login";
    }
  });

// when clicking input filed
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
