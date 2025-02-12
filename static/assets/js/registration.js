$(document).ready(function () {
    // Toggle password visibility
    var pass = $("input[name='password']");
    var repass = $("input[name='confirm_password']");
    var eye = $("#eye");
    var eye2 = $("#eye2");

    eye.click(function () {
        eye.toggleClass('active');
        pass.attr("type", pass.attr("type") === "password" ? "text" : "password");
    });

    eye2.click(function () {
        eye2.toggleClass('active');
        repass.attr("type", repass.attr("type") === "password" ? "text" : "password");
    });

