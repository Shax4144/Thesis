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
      if (
        field === "category" ||
        field === "belt" ||
        field === "weight_category"
      ) {
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

        // ✅ Auto-refresh history and records
        fetchPlayers(); // Refresh the table in history
        fetchFiles(); // Refresh the records in the record section
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
    const tableBody = document.querySelector("#players-table tbody");

    if (!tableBody) {
      console.error("Error: #players-table tbody not found.");
      return;
    }

    try {
      const response = await fetch("/api/players");
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

      console.log("✅ Players list updated successfully.");
    } catch (error) {
      console.error("❌ Error fetching players:", error);
      tableBody.innerHTML = `<tr><td colspan="7">Failed to load data</td></tr>`;
    }
  }
  window.fetchPlayers = fetchPlayers;

  // Print only the table
  printButton.addEventListener("click", function () {
    const { jsPDF } = window.jspdf; // Get jsPDF
    const doc = new jsPDF(); // Create a new PDF document

    // Add Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Players List", 105, 15, null, null, "center");

    // Select Table and Convert to AutoTable
    doc.autoTable({
      html: "#players-table", // Select table by ID
      startY: 25, // Positioning after title
      theme: "striped", // Table styling
      styles: { fontSize: 10 }, // Adjust font size
      headStyles: { fillColor: [0, 102, 204] }, // Header color (Blue)
    });

    // Save the PDF
    doc.save("Players_List.pdf");
  });

  archiveButton.addEventListener("click", async function () {
    if (!window.jspdf) {
      console.error("jsPDF is not loaded.");
      alert("Error: jsPDF library failed to load.");
      return;
    }

    // Show confirmation popup
    const confirmArchive = confirm(
      "Are you sure you want to archive the players list? This action cannot be undone."
    );
    if (!confirmArchive) {
      return; // Stop execution if user cancels
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Archived Players List", 105, 15, null, null, "center");

    // Convert table to AutoTable
    doc.autoTable({
      html: "#players-table",
      startY: 25,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 0, 0] }, // Red Header for archive
    });

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Convert the PDF to a Blob
    const pdfBlob = doc.output("blob");

    // Prepare form data to send the file
    const formData = new FormData();
    formData.append("file", pdfBlob, `Players_${formattedDate}.pdf`);

    try {
      // Send the file to the Archive API
      const response = await fetch("/api/Archive", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Players list archived successfully!");

        // Call API to clear players after archiving
        const clearResponse = await fetch("/api/players/clear", {
          method: "DELETE",
        });

        if (clearResponse.ok) {
          alert("Archived players removed from the list.");
          document.querySelector("#players-table tbody").innerHTML = "";
        } else {
          console.error("Failed to clear players.");
        }
      } else {
        alert("Error archiving players list.");
      }
    } catch (error) {
      console.error("Failed to archive:", error);
      alert("Failed to connect to archive API.");
    }
  });

  // Refresh players list
  refreshButton.addEventListener("click", function () {
    fetchPlayers();
  });

  // Fetch players when the page loads
  fetchPlayers();
});

document.getElementById("show-archives").addEventListener("click", function () {
  const archiveFolderId = "1GM5-ZA57QPylEhcMexwhhVmdd2g09ZRX"; // Replace with your actual Google Drive archive folder ID
  const archiveURL = `https://drive.google.com/drive/folders/${archiveFolderId}`;
  window.open(archiveURL, "_blank");
});

document.addEventListener("DOMContentLoaded", function () {
  const recordBox = document.querySelector(".record-box");
  const backButton = document.querySelector(".back-button");
  let currentFolder = null;

  const ROOT_FOLDER_ID = "1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v"; // Root folder

  async function fetchFiles() {
    const recordBox = document.querySelector(".record-box");

    if (!recordBox) {
      console.error("Error: .record-box not found.");
      return;
    }

    try {
      const response = await fetch("/folder/1NndBdfWTZl4ZMjGZWWb1UjgeVijl986v");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const files = await response.json();
      recordBox.innerHTML = ""; // Clear existing record content

      files.forEach((file) => {
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
  window.fetchFiles = fetchFiles;

  function displayFiles(files) {
    recordBox.innerHTML = "";
    files.forEach((file) => {
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
  }

  function toggleFolder(folderId) {
    fetchFiles(folderId);
    currentFolder = folderId;
    backButton.style.display = "block";
  }

  function goBack() {
    if (currentFolder !== ROOT_FOLDER_ID) {
      fetchFiles(ROOT_FOLDER_ID);
      currentFolder = ROOT_FOLDER_ID;
      backButton.style.display = "none";
    }
  }
  document
    .getElementById("archiveRecordButton")
    .addEventListener("click", async function () {
      // Confirm archiving action
      const confirmArchive = confirm(
        "Are you sure you want to archive the record contents? This action cannot be undone."
      );
      if (!confirmArchive) {
        return;
      }

      try {
        // Call Flask API to move record folders
        const response = await fetch("/api/archiveRecords", {
          method: "POST",
        });

        if (response.ok) {
          alert("Record content archived successfully!");
          fetchFiles(); // Refresh record box after archiving
        } else {
          alert("Error archiving record content.");
        }
      } catch (error) {
        console.error("Failed to archive record content:", error);
        alert("Failed to connect to archive API.");
      }
    });

  window.toggleFolder = toggleFolder;
  window.goBack = goBack;

  // Fetch files on load
  fetchFiles();
});

window.toggleFolder = toggleFolder;
window.goBack = goBack;

document.querySelectorAll(".open-window").forEach((button) => {
  button.addEventListener("click", function () {
    window.open(this.getAttribute("data-url"), "_blank");
  });
});
