const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");


if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;

        let isValid = true;

        // Clear previous errors
        document.getElementById("nameError").textContent = "";
        document.getElementById("emailError").textContent = "";
        document.getElementById("phoneError").textContent = "";
        document.getElementById("passwordError").textContent = "";


        // Name validation
        if (!name) {
            document.getElementById("nameError").textContent =
                "Name is required";

            isValid = false;
        }


        // Email validation
        if (!email) {
            document.getElementById("emailError").textContent =
                "Email is required";

            isValid = false;
        }


        // Phone validation
        if (!phone) {
            document.getElementById("phoneError").textContent =
                "Phone number is required";

            isValid = false;
        }


        // Password validation
        if (!password) {
            document.getElementById("passwordError").textContent =
                "Password is required";

            isValid = false;
        } else if (password.length < 6) {
            document.getElementById("passwordError").textContent =
                "Password must be at least 6 characters";

            isValid = false;
        }


        if (!isValid) {
            return;
        }


        // Temporary testing
        console.log({
            name,
            email,
            phone,
            password
        });
    });
}


if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const identifier =
            document.getElementById("identifier").value.trim();

        const password =
            document.getElementById("password").value;

        let isValid = true;


        // Clear previous errors
        document.getElementById("identifierError").textContent = "";
        document.getElementById("passwordError").textContent = "";


        // Identifier validation
        if (!identifier) {
            document.getElementById("identifierError").textContent =
                "Email or phone number is required";

            isValid = false;
        }


        // Password validation
        if (!password) {
            document.getElementById("passwordError").textContent =
                "Password is required";

            isValid = false;
        }


        if (!isValid) {
            return;
        }


        // Temporary testing
        console.log({
            identifier,
            password
        });
    });
}