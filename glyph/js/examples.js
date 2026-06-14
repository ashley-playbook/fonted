/** Example name chips — load text into the generator field */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".exampleChip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = document.getElementById("field");
      if (!field) return;
      field.value = btn.dataset.example || "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.focus();
    });
  });
});
