'use strict';

/* ─── Sticky header ─────────────────────────────────────────── */
const header = document.querySelector('.header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('header--sticky', window.scrollY > 30);
    }, { passive: true });
}

/* ─── Footer logo fallback ──────────────────────────────────── */
const footerLogo = document.querySelector('.footer__logo');
const footerPlaceholder = document.querySelector('.footer__logo-placeholder');
if (footerLogo && footerPlaceholder) {
    footerLogo.addEventListener('error', () => {
        footerLogo.hidden = true;
        footerPlaceholder.classList.add('is-visible');
        footerPlaceholder.classList.remove('footer__logo-placeholder--hidden');
    }, { once: true });
}

/* ─── Enquiry form validation ───────────────────────────────── */
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
    const successMessage = document.getElementById('enquiryFormSuccess');
    const fields = [
        {
            input: document.getElementById('parent-name'),
            error: document.getElementById('parent-name-error'),
            message: 'Please enter the parent\'s name.',
            validate: (value) => value.trim().length >= 2
        },
        {
            input: document.getElementById('phone'),
            error: document.getElementById('phone-error'),
            message: 'Please enter a valid 10-digit phone number.',
            validate: (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))
        },
        {
            input: document.getElementById('grade'),
            error: document.getElementById('grade-error'),
            message: 'Please select a grade.',
            validate: (value) => value !== ''
        }
    ];

    function setFieldState(field, isValid, message = '') {
        field.input.setAttribute('aria-invalid', String(!isValid));
        field.error.textContent = isValid ? '' : message;
    }

    fields.forEach((field) => {
        field.input.addEventListener('input', () => {
            if (field.input.getAttribute('aria-invalid') === 'true') {
                setFieldState(field, field.validate(field.input.value), field.message);
            }
            if (successMessage) {
                successMessage.textContent = '';
            }
        });

        field.input.addEventListener('blur', () => {
            if (field.input.value !== '' || field.input.required) {
                setFieldState(field, field.validate(field.input.value), field.message);
            }
        });
    });

    enquiryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let isFormValid = true;

        fields.forEach((field) => {
            const isValid = field.validate(field.input.value);
            setFieldState(field, isValid, field.message);
            if (!isValid) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            enquiryForm.reset();
            fields.forEach((field) => setFieldState(field, true));
            if (successMessage) {
                successMessage.textContent = 'Thank you! Your enquiry has been submitted successfully.';
            }
        } else {
            if (successMessage) {
                successMessage.textContent = '';
            }
            const firstInvalid = fields.find((field) => !field.validate(field.input.value));
            firstInvalid?.input.focus();
        }
    });
}

/* ─── Exhibition carousel ───────────────────────────────────── */
(() => {
    const sliderOuter = document.querySelector('.exhibition__slider-outer');
    const slider = document.getElementById('exhibitSlider');
    const btnPrev = document.getElementById('exhibitPrev');
    const btnNext = document.getElementById('exhibitNext');
    const status = document.getElementById('exhibitSliderStatus');

    if (!sliderOuter || !slider || !btnPrev || !btnNext) return;

    const cards = slider.querySelectorAll('.exhibit-card');
    const total = cards.length;
    let current = 0;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        slider.style.transition = 'none';
    }

    function visibleCount() {
        if (window.innerWidth <= 580) return 1;
        if (window.innerWidth <= 900) return 2;
        return 3;
    }

    function cardStep() {
        return cards[0].offsetWidth + 20;
    }

    function maxIndex() {
        return Math.max(0, total - visibleCount());
    }

    function updateSlideAccessibility() {
        const visible = visibleCount();
        cards.forEach((card, index) => {
            const isVisible = index >= current && index < current + visible;
            card.setAttribute('aria-hidden', String(!isVisible));
            card.tabIndex = isVisible ? 0 : -1;
            if (index === current) {
                card.setAttribute('aria-current', 'true');
            } else {
                card.removeAttribute('aria-current');
            }
        });

        const activeCard = cards[current];
        if (activeCard && status) {
            const label = activeCard.getAttribute('aria-label') || '';
            status.textContent = `${label}. Showing slides ${current + 1} to ${Math.min(current + visible, total)} of ${total}.`;
        }

        btnPrev.disabled = current === 0;
        btnNext.disabled = current >= maxIndex();
        btnPrev.setAttribute('aria-disabled', String(current === 0));
        btnNext.setAttribute('aria-disabled', String(current >= maxIndex()));
    }

    function goTo(index) {
        current = Math.max(0, Math.min(index, maxIndex()));
        slider.style.transform = `translateX(-${current * cardStep()}px)`;
        updateSlideAccessibility();
    }

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));

    let startX = 0;
    sliderOuter.addEventListener('touchstart', (event) => {
        startX = event.touches[0].clientX;
    }, { passive: true });

    sliderOuter.addEventListener('touchend', (event) => {
        const dragDelta = event.changedTouches[0].clientX - startX;
        if (dragDelta < -50) goTo(current + 1);
        else if (dragDelta > 50) goTo(current - 1);
    });

    sliderOuter.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(current - 1);
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(current + 1);
        }
        if (event.key === 'Home') {
            event.preventDefault();
            goTo(0);
        }
        if (event.key === 'End') {
            event.preventDefault();
            goTo(maxIndex());
        }
    });

    window.addEventListener('resize', () => goTo(current));
    goTo(0);
})();

/* ─── Choose section: mobile swipe slider ───────────────────── */
(() => {
    const carousel = document.querySelector('.choose__carousel');
    const track = document.getElementById('chooseSlider');
    const dots = Array.from(document.querySelectorAll('.choose__dot'));
    const status = document.getElementById('chooseSliderStatus');

    if (!carousel || !track || !dots.length) return;

    const slides = track.querySelectorAll('.choose__slide');
    const total = slides.length;
    let current = 0;
    let startX = 0;

    const mobileQuery = window.matchMedia('(max-width: 768px)');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        track.style.transition = 'none';
    }

    function isMobile() {
        return mobileQuery.matches;
    }

    function updateUI() {
        if (!isMobile()) {
            track.style.transform = '';
            slides.forEach((slide) => slide.removeAttribute('aria-hidden'));
            slides.forEach((slide) => slide.removeAttribute('aria-current'));
            return;
        }

        track.style.transform = `translateX(-${current * 100}%)`;

        dots.forEach((dot, index) => {
            const selected = index === current;
            dot.setAttribute('aria-selected', String(selected));
            dot.tabIndex = selected ? 0 : -1;
        });

        slides.forEach((slide, index) => {
            const isCurrent = index === current;
            slide.setAttribute('aria-hidden', String(!isCurrent));
            if (isCurrent) {
                slide.setAttribute('aria-current', 'true');
            } else {
                slide.removeAttribute('aria-current');
            }
        });

        if (status) {
            const label = slides[current]?.getAttribute('aria-label') || '';
            status.textContent = `${label}. Slide ${current + 1} of ${total}.`;
        }
    }

    function goTo(index) {
        if (!isMobile()) return;
        current = Math.max(0, Math.min(index, total - 1));
        updateUI();
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goTo(index));

        dot.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goTo(index);
                return;
            }

            let targetIndex = null;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                targetIndex = (index + 1) % total;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                targetIndex = (index - 1 + total) % total;
            }
            if (event.key === 'Home') targetIndex = 0;
            if (event.key === 'End') targetIndex = total - 1;

            if (targetIndex !== null) {
                event.preventDefault();
                goTo(targetIndex);
                dots[targetIndex].focus();
            }
        });
    });

    carousel.addEventListener('keydown', (event) => {
        if (!isMobile()) return;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(current - 1);
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(current + 1);
        }
        if (event.key === 'Home') {
            event.preventDefault();
            goTo(0);
        }
        if (event.key === 'End') {
            event.preventDefault();
            goTo(total - 1);
        }
    });

    carousel.addEventListener('touchstart', (event) => {
        if (!isMobile()) return;
        startX = event.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (event) => {
        if (!isMobile()) return;
        const dragDelta = event.changedTouches[0].clientX - startX;
        if (dragDelta < -50) goTo(current + 1);
        else if (dragDelta > 50) goTo(current - 1);
    });

    mobileQuery.addEventListener('change', updateUI);
    updateUI();
})();
