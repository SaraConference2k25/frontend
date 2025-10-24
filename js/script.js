document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const role = document.getElementById('role').value;

            if (username === '' || password === '' || role === '') {
                alert('Please fill in all fields and select a role.');
                return;
            }
            // In a real application, you would send this to a server for validation.
            // For this frontend-only demo, we'll just redirect.
            alert('Login successful!');
            window.location.href = 'dashboard.html';
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();
            const role = document.getElementById('role').value;

            if (username === '' || password === '' || confirmPassword === '' || role === '') {
                alert('Please fill in all fields and select a role.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            // In a real application, you would send this to a server to create an account.
            // For this frontend-only demo, we'll just redirect.
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        });
    }
});