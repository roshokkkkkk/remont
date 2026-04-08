document.addEventListener('DOMContentLoaded', () => {
  const menu = document.querySelector('.menu') as HTMLElement | null;
  const burger = document.getElementById('burger-menu') as HTMLButtonElement | null;

  if (menu && burger) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }

  interface SliderElements {
    viewport: HTMLElement;
    track: HTMLElement;
    prev: HTMLButtonElement;
    next: HTMLButtonElement;
  }

  function initWorksSliders(): void {
    const sliders = document.querySelectorAll('.our-works-slider');
    
    sliders.forEach((slider: Element) => {
      const viewport = slider.querySelector('.our-works-wrp') as HTMLElement | null;
      const track = slider.querySelector('.our-works-track') as HTMLElement | null;
      const prev = slider.querySelector('.our-works-prev') as HTMLButtonElement | null;
      const next = slider.querySelector('.our-works-next') as HTMLButtonElement | null;

      if (!viewport || !track || !prev || !next) {
        return;
      }

      let step = 0;

      const computeStep = (): void => {
        const firstItem = track.querySelector('.our-works-wrp-item') as HTMLElement | null;
        if (!firstItem) {
          step = 0;
          return;
        }

        const styles = window.getComputedStyle(track);
        const gapValue = styles.gap || styles.columnGap || '0px';
        const gap = Number.parseFloat(gapValue) || 0;
        step = firstItem.getBoundingClientRect().width + gap;
      };

      const updateButtons = (): void => {
        const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
        prev.disabled = viewport.scrollLeft <= 1;
        next.disabled = viewport.scrollLeft >= maxScrollLeft - 1;
      };

      const scrollByStep = (direction: number): void => {
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

  const form = document.getElementById('repair-form') as HTMLFormElement | null;
  const status = document.getElementById('repair-form-status') as HTMLElement | null;
  const submitButton = document.getElementById('repair-submit') as HTMLButtonElement | null;
  const localApiUrl = 'http://localhost:3000/api/requests';

  interface FormPayload {
    full_name: string;
    email: string;
    address: string;
    details: string;
  }

  interface ApiResponse {
    message?: string;
    [key: string]: unknown;
  }

  type StatusVariant = 'success' | 'error' | undefined;

  function getApiUrl(): string {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (window.location.protocol === 'file:') {
      return localApiUrl;
    }
    
    if (isLocalHost && window.location.port && window.location.port !== '3000') {
      return localApiUrl;
    }
    
    return '/api/requests';
  }

  function setStatus(message: string, variant?: StatusVariant): void {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove('repair-form-status-success', 'repair-form-status-error');
    
    if (variant === 'success') {
      status.classList.add('repair-form-status-success');
    } else if (variant === 'error') {
      status.classList.add('repair-form-status-error');
    }
  }

  function validateForm(payload: FormPayload): string | null {
    if (!payload.full_name || !payload.email || !payload.address) {
      return 'Заполните ФИО, почту и адрес.';
    }
    return null;
  }

  if (form && submitButton) {
    form.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
      event.preventDefault();

      const payload: FormPayload = {
        full_name: (form.elements.namedItem('full_name') as HTMLInputElement).value.trim(),
        email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
        address: (form.elements.namedItem('address') as HTMLInputElement).value.trim(),
        details: (form.elements.namedItem('details') as HTMLTextAreaElement).value.trim(),
      };

      const validationError = validateForm(payload);
      if (validationError) {
        setStatus(validationError, 'error');
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

        const result: ApiResponse = await response.json().catch((): ApiResponse => ({}));
        
        if (!response.ok) {
          const errorText = result.message || `Ошибка сервера (${response.status}).`;
          setStatus(errorText, 'error');
          return;
        }

        form.reset();
        setStatus('Заявка отправлена.', 'success');
      } catch (error: unknown) {
        console.error(error);
        setStatus(
          'Нет соединения с API. Откройте сайт через http://localhost:3000/index.html и проверьте npm start.',
          'error'
        );
      } finally {
        submitButton.disabled = false;
      }
    });
  }
});