
/* music and sounds
 */
(function () {
    "use strict";

    const STORAGE_KEY = "replay-sound-enabled";
    let enabled = false;
    let audioContext = null;
    let musicTimer = null;
    let musicStep = 0;
    let shakeSource = null;
    let shakeGain = null;
    let noiseBuffer = null;

    try {
        enabled = localStorage.getItem(STORAGE_KEY) === "true";
    } catch (_) {}

    function setupControl() {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "replay-audio-toggle";

        button.innerHTML = `
            <svg viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">

                <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>

                <path class="sound-on"
                    d="M15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12">
                </path>

                <path class="sound-off"
                    d="m16 9 5 6m0-6-5 6">
                </path>
            </svg>
        `;

        button.addEventListener("click", async function () {
            enabled = !enabled;

            try {
                localStorage.setItem(STORAGE_KEY, String(enabled));
            } catch (_) {}

            if (enabled) {
                await startAudio();
            } else {
                stopMusic();
                stopShake();
            }

            updateControl(button);
        });

        document.body.appendChild(button);
        updateControl(button);
    }

    function updateControl(button) {
        button.classList.toggle("is-muted", !enabled);
        button.setAttribute("aria-pressed", String(enabled));
        button.setAttribute(
            "aria-label",
            enabled ? "Mute sound" : "Unmute sound"
        );
        button.title = enabled ? "Mute" : "Unmute";
    }

    function getContext() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioContext) audioContext = new AudioCtx();
        return audioContext;
    }

    async function startAudio() {
        const ctx = getContext();
        if (!ctx) return;

        if (ctx.state === "suspended") {
            try {
                await ctx.resume();
            } catch (_) {
                return;
            }
        }

        if (!musicTimer) {
            musicStep = 0;
            playMusicStep();
            musicTimer = window.setInterval(playMusicStep, 300);
        }
    }

    // original tune
    const melody = [72, 76, 79, 84, 83, 79, 76, 79, 81, 84, 88, 84, 81, 79, 76, 79];

    function playTone(frequency, start, duration, volume, wave) {
        const ctx = getContext();
        if (!ctx || ctx.state !== "running") return;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = wave || "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    function playMusicStep() {
        if (!enabled) return;

        const ctx = getContext();
        if (!ctx || ctx.state !== "running") return;

        const now = ctx.currentTime + 0.015;
        const note = melody[musicStep % melody.length];

        playTone(
            440 * Math.pow(2, (note - 69) / 12),
            now,
            0.27,
            0.032,
            "triangle"
        );

        if (musicStep % 2 === 0) {
            const bassNotes = [48, 55, 60, 53, 50, 57, 60, 55];
            const bass = bassNotes[Math.floor(musicStep / 4) % bassNotes.length];

            playTone(
                440 * Math.pow(2, (bass - 69) / 12),
                now,
                0.22,
                0.025,
                "sine"
            );
        }

        musicStep += 1;
    }

    function makeNoiseBuffer(ctx) {
        const length = Math.floor(ctx.sampleRate * 1.2);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) *
                (0.5 + 0.5 * Math.sin(i / 25));
        }

        return buffer;
    }

    function startShake() {
        if (!enabled) return;

        const ctx = getContext();
        if (!ctx || ctx.state !== "running" || shakeSource) return;

        if (!noiseBuffer) noiseBuffer = makeNoiseBuffer(ctx);

        shakeSource = ctx.createBufferSource();
        shakeSource.buffer = noiseBuffer;
        shakeSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1450;
        filter.Q.value = 1.1;

        shakeGain = ctx.createGain();
        shakeGain.gain.value = 0.0001;

        shakeSource.connect(filter);
        filter.connect(shakeGain);
        shakeGain.connect(ctx.destination);
        shakeSource.start();

        const now = ctx.currentTime;
        shakeGain.gain.setValueAtTime(0.0001, now);
        shakeGain.gain.linearRampToValueAtTime(0.055, now + 0.06);

        // vending shaking sounds
        for (let t = now + 0.08; t < now + 2.3; t += 0.16) {
            shakeGain.gain.setValueAtTime(0.055, t);
            shakeGain.gain.linearRampToValueAtTime(0.008, t + 0.075);
        }
    }

    function stopShake() {
        if (!shakeSource) return;

        const ctx = getContext();

        try {
            if (ctx && shakeGain) {
                shakeGain.gain.cancelScheduledValues(ctx.currentTime);
                shakeGain.gain.setTargetAtTime(
                    0.0001,
                    ctx.currentTime,
                    0.035
                );
            }

            const source = shakeSource;

            window.setTimeout(function () {
                try {
                    source.stop();
                } catch (_) {}

                try {
                    source.disconnect();
                } catch (_) {}
            }, 180);
        } catch (_) {}

        shakeSource = null;
        shakeGain = null;
    }

    function stopMusic() {
        if (musicTimer) window.clearInterval(musicTimer);
        musicTimer = null;
        stopShake();
    }

    document.addEventListener("replay:shake:start", startShake);
    document.addEventListener("replay:shake:stop", stopShake);

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stopShake();
    });

    function init() {
        const style = document.createElement("style");

        style.textContent = `
            .replay-audio-toggle {
                position: fixed;
                right: 16px;
                bottom: 16px;
                z-index: 9999;

                display: flex;
                align-items: center;
                justify-content: center;

                width: 42px;
                height: 42px;
                padding: 8px;

                border: 2px solid #47343F;
                border-radius: 12px;

                background: #FFF9EE;
                color: #47343F;

                box-shadow: 2px 3px 0 #C65B89;
                cursor: pointer;
            }

            .replay-audio-toggle:hover {
                background: #FCE1EA;
            }

            .replay-audio-toggle:focus-visible {
                outline: 3px solid #C65B89;
                outline-offset: 3px;
            }

            .replay-audio-toggle .sound-off {
                display: none;
            }

            .replay-audio-toggle.is-muted .sound-on {
                display: none;
            }

            .replay-audio-toggle.is-muted .sound-off {
                display: block;
            }

            /* keep the icon above vending page navigation */

            body:has(.vending-page) .replay-audio-toggle {
                bottom: 76px;
            }

            @media (max-width: 480px) {
                .replay-audio-toggle {
                    right: 10px;
                    bottom: 10px;
                    width: 40px;
                    height: 40px;
                }

                body:has(.vending-page) .replay-audio-toggle {
                    bottom: 68px;
                }
            }
        `;

        document.head.appendChild(style);
        setupControl();

        
        if (enabled) {
            startAudio();

            
            document.addEventListener("pointerdown", function unlockAudio() {
                if (enabled) startAudio();
                document.removeEventListener("pointerdown", unlockAudio);
            }, { once: true });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
