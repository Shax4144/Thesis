var pass = document.getElementById('pass');
var eye = document.getElementById('eye');

eye.addEventListener('click', togglePass);
eye2.addEventListener('click', togglePass1);

function togglePass(){
    eye.classList.toggle('active');

    (pass.type == 'password') ? pass.type = 'text' : pass.type = 'password';
}