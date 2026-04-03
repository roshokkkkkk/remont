document.addEventListener('DOMContentLoaded', () => {
  const menu = document.querySelector('.menu');
  const burger = document.getElementById('burger-menu');

  if (menu && burger) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }

  function initWorksSliders() {
    const sliders = document.querySelectorAll('.our-works-slider');
    sliders.forEach((slider) => {
      const viewport = slider.querySelector('.our-works-wrp');
      const track = slider.querySelector('.our-works-track');
      const prev = slider.querySelector('.our-works-prev');
      const next = slider.querySelector('.our-works-next');

      if (!viewport || !track || !prev || !next) {
        return;
      }

      let step = 0;

      const computeStep = () => {
        const firstItem = track.querySelector('.our-works-wrp-item');
        if (!firstItem) {
          step = 0;
          return;
        }

        const styles = window.getComputedStyle(track);
        const gapValue = styles.gap || styles.columnGap || '0px';
        const gap = Number.parseFloat(gapValue) || 0;
        step = firstItem.getBoundingClientRect().width + gap;
      };

      const updateButtons = () => {
        const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
        prev.disabled = viewport.scrollLeft <= 1;
        next.disabled = viewport.scrollLeft >= maxScrollLeft - 1;
      };

      const scrollByStep = (direction) => {
        if (!step) {
          computeStep();
        }
        viewport.scrollBy({ left: direction * step, behavior: 'smooth' });
      };

      prev.addEventListener('click', () => scrollByStep(-1));
      next.addEventListener('click', () => scrollByStep(1));

      viewport.addEventListener('scroll', () => {
        window.requestAnimationFrame(updateButtons);
      });

      window.addEventListener('resize', () => {
        computeStep();
        updateButtons();
      });

      computeStep();
      updateButtons();
    });
  }

  initWorksSliders();

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

  if (form && submitButton) {
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
  }
});
