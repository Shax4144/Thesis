
document.addEventListener("DOMContentLoaded", function () {
 
    const dashboard = document.querySelector(".dashboard");
    const profile = document.querySelector(".profile");
    const history = document.querySelector(".history");
    const record = document.querySelector(".record");
    const news = document.querySelector(".news");
   

    const dashboardContent = document.getElementById("dashboard-content");
    const profileContent = document.getElementById("profile-content");
    const historyContent = document.getElementById("history-content");
    const recordContent = document.getElementById("record-content");
    const newsContent = document.getElementById("news-content");
   

   
    function hideAllContent() {
        dashboardContent.classList.remove("active");
        profileContent.classList.remove("active");
        historyContent.classList.remove("active");
        recordContent.classList.remove("active");
        newsContent.classList.remove("active");
    

        dashboard.classList.remove("active");
        profile.classList.remove("active");
        history.classList.remove("active");
        record.classList.remove("active");
        news.classList.remove("active");
     
    }


    hideAllContent();
    dashboardContent.classList.add("active");
    dashboard.classList.add("active");

   
    dashboard.addEventListener("click", function () {
        hideAllContent();
        dashboardContent.classList.add("active");
        dashboard.classList.add("active");
    });
    
    profile.addEventListener("click", function () {
        hideAllContent();
        profileContent.classList.add("active");
        profile.classList.add("active");
    });

    history.addEventListener("click", function () {
        hideAllContent();
        historyContent.classList.add("active");
        history.classList.add("active");
    });
    record.addEventListener("click", function () {
        hideAllContent();
        recordContent.classList.add("active");
        record.classList.add("active");
    });

    news.addEventListener("click", function () {
        hideAllContent();
        newsContent.classList.add("active");
        news.classList.add("active");
    });

    
});
