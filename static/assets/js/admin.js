//SIDE NAVIGATION BAR
document.addEventListener("DOMContentLoaded", function () {
  // Sidebar Navigation Elements
  const navItems = document.querySelectorAll(".container-nav-circle");

  // Page Content Sections
  const contentSections = {
    dashboard: document.getElementById("dashboard-content"),
    history: document.getElementById("history-content"),
    record: document.getElementById("record-content"),
    news: document.getElementById("news-content"),
  };

  // Function to Hide All Sections
  function hideAllSections() {
    Object.values(contentSections).forEach((section) => {
      section.style.display = "none";
    });
  }

  // Function to Remove Active Class from Sidebar Buttons
  function removeActiveClass() {
    navItems.forEach((item) => item.classList.remove("active"));
  }

  // Set Default View to Dashboard
  hideAllSections();
  contentSections.dashboard.style.display = "block";
  document.querySelector(".dashboard").classList.add("active");

  // Attach Click Event to Sidebar Items
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      hideAllSections();
      removeActiveClass();
      let sectionClass = this.classList[0];
      if (contentSections[sectionClass]) {
        contentSections[sectionClass].style.display = "block";
      }
      this.classList.add("active");
    });
  });
});
//====================================================================================================

// REGISTER PLAYERS
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form[name='signup_form']");
  const submitButton = form ? form.querySelector(".btn-submit") : null;

  if (!form || !submitButton) {
    console.error("❌ Error: Registration form or submit button not found.");
    return;
  }

  // ✅ Remove previous event listener before adding a new one
  submitButton.removeEventListener("click", handleFormSubmit);
  submitButton.addEventListener("click", handleFormSubmit);
});

async function handleFormSubmit(event) {
  event.preventDefault(); // Prevent default form submission

  // Prevent double-click issue by disabling the button temporarily
  const submitButton = event.target;
  submitButton.disabled = true;

  // Gather form data
  const formData = new FormData(
    document.querySelector("form[name='signup_form']")
  );
  let data = {};
  formData.forEach((value, key) => {
    data[key] = value.trim();
  });

  console.log("📨 Sending Registration Data:", data); // Debugging output

  // Ensure required fields are filled
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
  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field] === "select"
  );

  if (missingFields.length > 0) {
    alert("⚠️ Please fill in all required fields: " + missingFields.join(", "));
    submitButton.disabled = false; // Re-enable button
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
    console.log("✅ Server Response:", result);

    if (result.message) {
      alert("🎉 Player registered successfully!");
      document.querySelector("form[name='signup_form']").reset();
      fetchPlayers(); // Refresh list
    } else {
      alert("❌ Error: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
    alert("⚠️ An error occurred: " + error.message);
  } finally {
    // ✅ Ensure button is re-enabled after response
    submitButton.disabled = false;
  }
}

//====================================================================================================

//FETHC PLAYERS
document.addEventListener("DOMContentLoaded", function () {
  async function fetchPlayers() {
    const tableBody = document.querySelector("#players-table tbody");
    if (!tableBody) {
      console.error("❌ Error: #players-table tbody not found.");
      return;
    }

    try {
      const response = await fetch("/api/players");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const players = await response.json();
      tableBody.innerHTML = "";

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

      console.log("✅ Players list updated successfully.");
    } catch (error) {
      console.error("❌ Error fetching players:", error);
      tableBody.innerHTML = `<tr><td colspan="7">⚠️ Failed to load data</td></tr>`;
    }
  }

  window.fetchPlayers = fetchPlayers;
  fetchPlayers();
});
//====================================================================================================

//FETCH FILES

document.addEventListener("DOMContentLoaded", function () {
  async function fetchFiles() {
    const recordBox = document.querySelector(".record-box");
    if (!recordBox) {
      console.error("❌ Error: .record-box not found.");
      return;
    }
  
    try {
      console.log("📨 Fetching files...");
      const response = await fetch("/folder/1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v");
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("📂 Server Response:", data); // 🔍 Debug response
  
      if (!Array.isArray(data)) {
        throw new Error("❌ API response is not an array!");
      }
  
      recordBox.innerHTML = "";
  
      if (data.length === 0) {
        recordBox.innerHTML = "<p>No files found.</p>";
        return;
      }
  
      data.forEach((file) => {
        const div = document.createElement("div");
  
        if (file.mimeType === "application/vnd.google-apps.folder") {
          div.innerHTML = `
            <i class="fa-solid fa-folder folder-icon" onclick="toggleFolder('${file.id}')"></i>
            <span class="folder" onclick="toggleFolder('${file.id}')">${file.name}</span>
          `;
        } else {
          div.innerHTML = `
            <i class="fa-solid fa-file file-icon"></i>
            <a href="${file.webViewLink}" target="_blank" class="file">${file.name}</a>
          `;
        }
        recordBox.appendChild(div);
      });
  
      console.log("✅ Record files updated successfully.");
    } catch (error) {
      console.error("❌ Error fetching files:", error);
      recordBox.innerHTML = "<p>Failed to load files.</p>";
    }
  }
  
});

//====================================================================================================

//TOGGLE FOLDER
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("archiveButton")
    .addEventListener("click", async function () {
      const confirmArchive = confirm(
        "Are you sure you want to archive the players list?"
      );
      if (!confirmArchive) return;

      try {
        const response = await fetch("/api/Archive", { method: "POST" });

        if (response.ok) {
          alert("✅ Players archived successfully!");
          fetchPlayers();
        } else {
          alert("❌ Error archiving players.");
        }
      } catch (error) {
        console.error("❌ Error archiving:", error);
        alert("Failed to connect to archive API.");
      }
    });
});

//====================================================================================================
//REFRESH FILES
document.addEventListener("DOMContentLoaded", function () {
  async function fetchDashboardData() {
    try {
      const response = await fetch("/api/dashboard_data");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const playerCount = document.getElementById("number-players");
      if (playerCount) playerCount.textContent = data.players;
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    }
  }

  fetchDashboardData();
});
