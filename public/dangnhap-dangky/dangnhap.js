    window.onload = function () {
        document.getElementById("password1").onchange = validatePassword;
    }
    function validatePassword(){
        var pass1=document.getElementById("password1").value;
        document.getElementById("password1").setCustomValidity('');	 
		if (pass1 === "") {
			document.getElementById("password1").setCustomValidity('Vui lòng nhập mật khẩu');
		} else {
			document.getElementById("password1").setCustomValidity('');
		}
    }
