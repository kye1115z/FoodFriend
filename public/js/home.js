document.addEventListener("DOMContentLoaded", () => {
  const dateBox = document.querySelector(".date_box");
  const monthElem = dateBox.querySelector(".month");
  const dayElem = dateBox.querySelector(".day");

  const now = new Date();

  const options = {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
  };

  const dateFormatter = new Intl.DateTimeFormat("en-US", options);
  const formattedDate = dateFormatter.format(now);
  const [month, day] = formattedDate.split(" ");

  monthElem.innerText = month;
  dayElem.innerText = day;
});
