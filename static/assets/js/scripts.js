
$("#login_form").submit(function (e) {
    e.preventDefault();

    $.ajax({
        type: "POST",
        url: "/api/user/login",
        data: {
            username: $("#username").val(),
            password: $("#password").val()
        },
        success: function (response) {
            window.location.href = "/api/admin"; // Redirect on successful login
        },
        error: function (xhr) {
            $(".error").removeClass("error--hidden").text(xhr.responseJSON.error);
        }
    });
});