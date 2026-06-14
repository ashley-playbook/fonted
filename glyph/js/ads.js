/** Lazy-load ad slots when near viewport — paste AdSense ins tags in template first. */
(function () {
  function loadAdSlot(slot) {
    if (slot.dataset.adLoaded) return;
    slot.dataset.adLoaded = "1";
    const ins = slot.querySelector("ins.adsbygoogle");
    if (ins && window.adsbygoogle) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-ad-lazy]").forEach(loadAdSlot);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          loadAdSlot(e.target);
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "240px" }
  );

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-ad-lazy]").forEach((el) => io.observe(el));
  });
})();
