document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Mostrar el indicador de carga
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const successIcon = document.querySelector('.success-icon');
    const errorIcon = document.querySelector('.error-icon');
    const loadingText = document.querySelector('.loading-text');
    const countdownText = document.querySelector('.countdown-text');

    loadingOverlay.style.display = 'flex';
    loadingSpinner.style.display = 'block';
    successIcon.style.display = 'none';
    errorIcon.style.display = 'none';
    loadingText.textContent = 'Procesando registro...';
    countdownText.textContent = '';

    // Función para el contador regresivo
    function startCountdown(seconds) {
        let count = seconds;
        countdownText.textContent = `Autodireccionamiento a login en ${count} segundos...`;

        const timer = setInterval(() => {
            count--;
            countdownText.textContent = `Autodireccionamiento a login en ${count} segundos...`;

            if (count <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    }

    // Validar que las contraseñas coincidan
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    if (password !== password2) {
        loadingSpinner.style.display = 'none';
        errorIcon.style.display = 'block';
        loadingText.textContent = 'Las contraseñas no coinciden';
        countdownText.textContent = '';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 2000);
        return;
    }

    // Crear objeto de datos con valores por defecto
    const formData = {
        email: document.getElementById('email').value,
        password: password,
        name: document.getElementById('email').value,      
        company: 'N/A',                  
        location: 'No especificado',
        phone: '0000000000',
        description: 'N/A'
    };

    try {
        const response = await fetch('https://test-systemauth.alphadocere.cl//register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            loadingSpinner.style.display = 'none';
            successIcon.style.display = 'block';
            loadingText.textContent = data.message || 'Se ha enviado un correo electrónico de verificación. Revisa tu bandeja de entrada.';
            startCountdown(5);
            document.getElementById('register-form').reset();

            setTimeout(() => {
                window.location.href = 'login';
            }, 5000);
        } else {
            loadingSpinner.style.display = 'none';
            errorIcon.style.display = 'block';
            loadingText.textContent = data.error || 'Error en el registro. Inténtalo de nuevo.';
            countdownText.textContent = '';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        loadingSpinner.style.display = 'none';
        errorIcon.style.display = 'block';
        loadingText.textContent = 'Error en la conexión. Inténtalo más tarde.';
        countdownText.textContent = '';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 2000);
    }
});
