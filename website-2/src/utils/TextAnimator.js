// ============================================
// TEXT ANIMATOR — Cinematic text overlays w/ GSAP
// ============================================
import gsap from 'gsap';

export class TextAnimator {
    constructor(containerEl) {
        this.container = containerEl;
        this.current = null;
    }

    /**
     * Show cinematic text (title + subtitle) with animation
     */
    show(title, subtitle = '', className = '', duration = 1.5) {
        this.hide(0.3);

        const wrapper = document.createElement('div');
        wrapper.className = `cinematic-text ${className}`;

        const h1 = document.createElement('h1');
        h1.textContent = title;
        wrapper.appendChild(h1);

        if (subtitle) {
            const p = document.createElement('p');
            p.textContent = subtitle;
            wrapper.appendChild(p);
        }

        this.container.appendChild(wrapper);
        this.current = wrapper;

        gsap.fromTo(wrapper,
            { opacity: 0, y: 40, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: duration,
                ease: 'power3.out',
            }
        );

        // Stagger children
        gsap.fromTo(wrapper.children,
            { opacity: 0, y: 20 },
            {
                opacity: 1, y: 0,
                duration: 0.8,
                stagger: 0.15,
                delay: 0.3,
                ease: 'power2.out',
            }
        );
    }

    /**
     * Hide current text
     */
    hide(duration = 0.5) {
        if (this.current) {
            const el = this.current;
            gsap.to(el, {
                opacity: 0,
                y: -20,
                duration,
                ease: 'power2.in',
                onComplete: () => el.remove(),
            });
            this.current = null;
        }
    }

    /**
     * Typewriter effect text
     */
    typewriter(text, className = '', speed = 40) {
        this.hide(0.2);

        const wrapper = document.createElement('div');
        wrapper.className = `cinematic-text ${className}`;
        const p = document.createElement('p');
        wrapper.appendChild(p);
        this.container.appendChild(wrapper);
        this.current = wrapper;

        gsap.to(wrapper, { opacity: 1, duration: 0.3 });

        let index = 0;
        const interval = setInterval(() => {
            p.textContent = text.slice(0, index + 1);
            index++;
            if (index >= text.length) clearInterval(interval);
        }, speed);
    }

    dispose() {
        if (this.current) this.current.remove();
        this.current = null;
    }
}
