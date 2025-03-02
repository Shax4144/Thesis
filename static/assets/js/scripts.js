$("#login_form").submit(function (e) {
    e.preventDefault();

    $.ajax({
        type: "POST",
        url: "/user/login",
        data: {
            username: $("#username").val(),
            password: $("#password").val()
        },
        success: function (response) {
            window.location.href = "/admin"; // Redirect on successful login
        },
        error: function (xhr) {
            $(".error").removeClass("error--hidden").text(xhr.responseJSON.error);
        }
    });
});