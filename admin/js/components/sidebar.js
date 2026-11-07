
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");

export function initializeSidebar() {

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {

        const clickedInsideSidebar = sidebar.contains(event.target);
        const clickedMenuButton = menuToggle.contains(event.target);

        if (!clickedInsideSidebar && !clickedMenuButton) {
            sidebar.classList.remove("open");
        }

    });

}
