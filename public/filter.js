document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    // фильтрация
    const filterButtons = document.querySelectorAll(".filter-btn");
    const productCards = document.querySelectorAll(".products .card");

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const store = btn.dataset.store;

            productCards.forEach(card => {
                if (store === "all" || card.dataset.store === store) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });

            // закрываем меню на мобильных после выбора фильтра
            if (window.innerWidth <= 900) {
                sidebar.classList.remove("active");
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-sidebar-btn");
    const closeBtn = document.querySelector(".close-sidebar-btn");

    // Открыть sidebar
    toggleBtn.addEventListener("click", () => {
        sidebar.classList.add("active");
    });

    // Закрыть sidebar
    closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });
});