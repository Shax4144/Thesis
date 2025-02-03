var pass = document.getElementById('pass');
var eye = document.getElementById('eye');
var eye2 = document.getElementById('eye2')

eye.addEventListener('click', togglePass);
eye2.addEventListener('click', togglePass1);

function togglePass(){
    eye.classList.toggle('active');

    (pass.type == 'password') ? pass.type = 'text' : pass.type = 'password';
}

function togglePass1(){
    eye2.classList.toggle('active');

    (repass.type == 'password') ? repass.type = 'text' : repass.type = 'password';
}