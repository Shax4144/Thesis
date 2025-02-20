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

    // Enforce age range (1-99)
    $("input[name='age']").on("input", function () {
        let min = 1;
        let max = 99;
        let value = parseInt($(this).val());

        if(isNaN(value)){
            $(this).val("");
            return;
        }
        if (value < min) {
            $(this).val(min);
        } else if (value > max) {
            $(this).val(max);
        }
    });

    // Handle signup form submission with AJAX
    $("#signup_form").submit(function (event) {
        event.preventDefault(); // Prevent default form submission

        let formData = {
            firstname: $("input[name='firstname']").val(),
            middlename: $("input[name='middlename']").val(),
            lastname: $("input[name='lastname']").val(),
            belt: $("select[name='belt']").val(),
            age: $("input[name='age']").val(),
            birthdate: $("input[name='birthdate']").val(),
            gym: $("input[name='gym']").val(),
            username: $("input[name='username']").val(),
            email: $("input[name='email']").val(),
            password: $("input[name='password']").val(),
            confirm_password: $("input[name='confirm_password']").val()
        };

        $.ajax({
            url: "/user/signup",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(formData),
            success: function (response) {
                alert(response.message); // Show success message
                window.location.href = "/login"; // Redirect to login page
            },
            error: function (xhr) {
                let errorMessage = xhr.responseJSON ? xhr.responseJSON.message : "Signup failed!";
                alert(errorMessage); // Show error message
            }
        });
    });

    const detailsField = $("#details");
    detailsField.on("input", function () {
        if (detailsField.val().trim() !== "") {
            detailsField.addClass("not-empty");
        } else {
            detailsField.removeClass("not-empty");
        }
    });
});

