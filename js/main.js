document.addEventListener('DOMContentLoaded', () => {
  const menu = document.querySelector('.menu');
  const burger = document.getElementById('burger-menu');

  if (menu && burger) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }

  const form = document.getElementById('repair-form');
  const status = document.getElementById('repair-form-status');
  const submitButton = document.getElementById('repair-submit');
  const localApiUrl = 'http://localhost:3000/api/requests';

  function getApiUrl() {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.location.protocol === 'file:') {
      return localApiUrl;
    }
    if (isLocalHost && window.location.port && window.location.port !== '3000') {
      return localApiUrl;
    }
    return '/api/requests';
  }

  function setStatus(message, variant) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove('repair-form-status-success', 'repair-form-status-error');
    if (variant === 'success') {
      status.classList.add('repair-form-status-success');
    }
    if (variant === 'error') {
      status.classList.add('repair-form-status-error');
    }
  }

  if (!form || !submitButton) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      address: form.address.value.trim(),
      details: form.details.value.trim(),
    };

    if (!payload.full_name || !payload.email || !payload.address) {
      setStatus('Заполните ФИО, почту и адрес.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Отправляем заявку...');

    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorText = result.message || `Ошибка сервера (${response.status}).`;
        setStatus(errorText, 'error');
        return;
      }

      form.reset();
      setStatus('Заявка отправлена.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(
        'Нет соединения с API. Откройте сайт через http://localhost:3000/main.html и проверьте npm start.',
        'error'
      );
    } finally {
      submitButton.disabled = false;
    }
  });
});
