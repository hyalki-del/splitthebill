/* ==========================================
   SPENSE - Main Application Logic
   Architecture: Modular State & UI Management
   ========================================== */

const taglineSets = [
    `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Spend simply.</strong><span class="block text-slate-700 mt-0.5">Enjoy the moment. / Leave the expense tracking to SPENSE.</span>`,
    `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Just add what you spent.</strong><span class="block text-slate-700 mt-0.5">Who paid? Who shares it? / SPENSE does the math.</span>`,
    `<strong class="block font-extrabold text-[#0f172a] text-sm sm:text-base">Settle easily.</strong><span class="block text-slate-700 mt-0.5">See exactly who owes whom — / and how much.</span>`
];

let taglineInterval = null;

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initTaglineCarousel() {
    const spot = document.getElementById('taglineSpot');
    if (!spot) return;

    const randomizedSets = shuffleArray([...taglineSets]);
    let currentIndex = 0;

    if (taglineInterval) {
        clearInterval(taglineInterval);
        taglineInterval = null;
    }

    function renderTagline() {
        spot.style.opacity = '0';
        setTimeout(() => {
            spot.innerHTML = randomizedSets[currentIndex];
            spot.style.opacity = '1';
            currentIndex = (currentIndex + 1) % randomizedSets.length;
        }, 150);
    }

    renderTagline();
    taglineInterval = setInterval(renderTagline, 2000); // 2 seconds per cycle
}

/* ==========================================
   Programmatic Corner-Drag Resizing Engine
   ========================================== */
function initResizableFrames() {
    const cards = document.querySelectorAll('.theme-card');

    cards.forEach((card, index) => {
        if (card.closest('#welcomeModal') || card.closest('#settingsModal') || card.closest('#shareModal') || card.closest('#recordingModal')) {
            return;
        }

        const storageKey = `spense_frame_dim_${index}`;
        const savedDim = localStorage.getItem(storageKey);
        if (savedDim) {
            try {
                const { width, height } = JSON.parse(savedDim);
                if (width) card.style.width = width;
                if (height) card.style.height = height;
            } catch (e) {
                console.error("Failed to parse frame dimensions", e);
            }
        }

        if (card.querySelector('.resize-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        card.appendChild(handle);

        let startX, startY, startWidth, startHeight;

        handle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = card.offsetWidth;
            startHeight = card.offsetHeight;

            document.body.classList.add('is-resizing');

            function onMouseMove(e) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                const newWidth = Math.max(280, startWidth + dx);
                const newHeight = Math.max(150, startHeight + dy);

                card.style.width = `${newWidth}px`;
                card.style.height = `${newHeight}px`;
            }

            function onMouseUp() {
                document.body.classList.remove('is-resizing');
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                localStorage.setItem(storageKey, JSON.stringify({
                    width: card.style.width,
                    height: card.style.height
                }));
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    });
}

// Initialization hooks on DOM Content Load
document.addEventListener('DOMContentLoaded', () => {
    initTaglineCarousel();
    initResizableFrames();
});
