document.addEventListener("DOMContentLoaded", function () {
  // Get all sidebar navigation elements
  const navItems = document.querySelectorAll(".container-nav-circle");

  // Get all main page content sections
  const contentSections = {
    dashboard: document.getElementById("dashboard-content"),
    history: document.getElementById("history-content"),
    record: document.getElementById("record-content"),
    news: document.getElementById("news-content"),
  };

  // Function to hide all content sections
  function hideAllSections() {
    Object.values(contentSections).forEach((section) => {
      section.style.display = "none";
    });
  }

  // Function to remove active class from all buttons
  function removeActiveClass() {
    navItems.forEach((item) => {
      item.classList.remove("active");
    });
  }

  // Set default view (Dashboard)
  hideAllSections();
  contentSections.dashboard.style.display = "block";
  document.querySelector(".dashboard").classList.add("active"); // Set Dashboard as active by default

  // Attach click events to sidebar menu items
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      hideAllSections(); // Hide all sections first
      removeActiveClass(); // Remove active class from all buttons

      // Get section name from the class of the clicked item
      let sectionClass = this.classList[0]; // e.g., "dashboard", "profile", etc.

      // Display the corresponding section
      if (contentSections[sectionClass]) {
        contentSections[sectionClass].style.display = "block";
      }

      // Add active class to the clicked button
      this.classList.add("active");
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const submitButton = document.querySelector(".btn-submit");

  if (!form || !submitButton) {
    console.error("Form or submit button not found.");
    return;
  }

  submitButton.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Gather form data
    const formData = new FormData(form);
    let data = {};
    formData.forEach((value, key) => {
      data[key] = value.trim(); // Trim input values
    });

    // Ensure all required fields are filled
    const requiredFields = [
      "firstname",
      "lastname",
      "category",
      "age",
      "belt",
      "gym",
      "weight",
      "weight_category",
    ];
    const missingFields = requiredFields.filter((field) => {
      if (field === "category" || field === "belt" || field === "weight_category") {
        return !data[field] || data[field] === "select";
      }
      return !data[field];
    });

    if (missingFields.length > 0) {
      alert("Please fill in all required fields: " + missingFields.join(", "));
      return;
    }

    try {
      const response = await fetch("/api/players/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Server Response:", result);

      if (result.message) {
        alert("Player registered successfully!");
        form.reset();
      } else {
        alert("Error: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("An error occurred: " + error.message);
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#players-table tbody");
  const printButton = document.getElementById("print-button");
  const refreshButton = document.querySelector(".btn-refresh"); // Select refresh button
  const playersTable = document.querySelector(".history-box"); // Select table container

  // Fetch registered players from Flask API
  async function fetchPlayers() {
    try {
      const response = await fetch("/api/players"); // Ensure this matches your Flask route
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const players = await response.json();
      tableBody.innerHTML = ""; // Clear existing data

      players.forEach((player) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${player.firstname}</td>
                    <td>${player.lastname}</td>
                    <td>${player.category}</td>
                    <td>${player.age}</td>
                    <td>${player.belt}</td>
                    <td>${player.gym}</td>
                    <td>${player.weight}</td>
                `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching players:", error);
      tableBody.innerHTML = `<tr><td colspan="7">Failed to load data</td></tr>`; // Adjusted colspan
    }
  }

  // Print only the table
  printButton.addEventListener("click", function () {
    const originalContent = document.body.innerHTML; // Store full page content
    const tableContent = playersTable.innerHTML; // Get only the table content

    document.body.innerHTML = `<div>${tableContent}</div>`; // Replace body with table only
    window.print(); // Open print dialog
    document.body.innerHTML = originalContent; // Restore original content
  });

  // Refresh players list
  refreshButton.addEventListener("click", function () {
    fetchPlayers();


    setInterval(fetchPlayers, 5000);

  });

  // Fetch players when the page loads
  fetchPlayers();
});

document.querySelectorAll(".open-window").forEach((button) => {
  button.addEventListener("click", function () {
    window.open(this.getAttribute("data-url"), "_blank");
  });


  try {
    const response = await fetch("/api/players/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Server Response:", result);

    if (response.ok) {
      alert(
        `Player registered successfully! Folder created in Google Drive: ${result.folder_id}`
      );
      form.reset();
    } else {
      alert("Error: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("An error occurred: " + error.message);
  }

});

document.addEventListener("DOMContentLoaded", function () {
    async function fetchDashboardData() {
        try {
            const response = await fetch('/api/dashboard_data');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            document.getElementById('number-players').textContent = data.players;
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }

    fetchDashboardData();

    // Auto-refresh dashboard data every 5 seconds
    setInterval(fetchDashboardData, 5000);
});