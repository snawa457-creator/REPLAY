
/* mood vending machine */

/* challenges for each mood */

const vendingChallenges = {
    sad: [
        "Draw something that makes you feel happy.",
        "Listen to three songs you loved growing up.",
        "Spend 10 minutes journaling about a happy memory.",
        "Make yourself a comforting drink and read a book.",
        "Take a short walk and photograph something beautiful.",
        "Write a letter to your younger self.",
        "Revisit a hobby you enjoyed as a child.",
        "Make a playlist of your favourite nostalgic songs.",
        "Colour or doodle for 15 minutes.",
        "Bake a small treat you remember loving."
    ],

    energized: [
        "Learn a new dance routine.",
        "Go on a 20-minute photography walk.",
        "Try a new sport or outdoor activity.",
        "Create something using materials you already own.",
        "Learn five new moves in a dance style you like.",
        "Try a quick DIY project.",
        "Take 10 creative photographs around your neighbourhood.",
        "Spend 20 minutes practicing an instrument.",
        "Go for a bike ride and explore somewhere new.",
        "Complete a 30-minute creative challenge."
    ],

    relaxed: [
        "Read one chapter of a book.",
        "Try a simple watercolour painting.",
        "Spend 15 minutes knitting or crocheting.",
        "Create a relaxing playlist.",
        "Do a small puzzle while listening to music.",
        "Write three pages in your journal.",
        "Try making an origami flower.",
        "Spend 20 minutes sketching.",
        "Make a scrapbook page of your favourite memories.",
        "Learn a simple embroidery stitch."
    ],

    creative: [
        "Create a collage using old magazines.",
        "Design your dream bedroom on paper.",
        "Take five artistic photographs.",
        "Write a short story using three random words.",
        "Invent a new dessert recipe.",
        "Draw a character inspired by your favourite animal.",
        "Design a logo for an imaginary brand.",
        "Make a miniature sculpture using clay.",
        "Create a mood board for your next project.",
        "Try drawing with your non-dominant hand."
    ],

    bored: [
        "Try a hobby you've never attempted before.",
        "Learn a simple magic trick.",
        "Create a five-minute doodle challenge.",
        "Find a new recipe and try making it.",
        "Learn how to fold three origami shapes.",
        "Start a small DIY project.",
        "Visit a library and find an interesting book.",
        "Try a new photography technique.",
        "Make a friendship bracelet.",
        "Learn one basic phrase in a new language."
    ],

    angry: [
        "Put on your favourite music and dance for 10 minutes.",
        "Write your thoughts in a journal.",
        "Go for a walk and photograph interesting textures.",
        "Create an abstract painting using bold colours.",
        "Try an energetic workout or sport.",
        "Tear old paper into pieces and turn it into a collage.",
        "Play an instrument or experiment with rhythm.",
        "Create a playlist that matches your energy.",
        "Spend 15 minutes sketching whatever comes to mind.",
        "Try a hands-on project like clay sculpting."
    ],

    happy: [
        "Create something inspired by your favourite memory.",
        "Try baking a colourful dessert.",
        "Make a playlist of songs that bring you joy.",
        "Take photographs of things you love.",
        "Start a fun creative project.",
        "Learn a new dance routine.",
        "Paint something using your favourite colours.",
        "Write a short story with a happy ending.",
        "Try a new hobby with a friend.",
        "Create a scrapbook page celebrating today."
    ]
};

/* set up vending machine */

function initializeVendingMachine() {
    const machine = document.getElementById("machine");
    const moodButtons = document.querySelectorAll(".mood-button");
    const ticket = document.getElementById("ticket");

    const challengeModal = document.getElementById("challengeModal");
    const modalMoodImage = document.getElementById("modalMoodImage");
    const challengeText = document.getElementById("challengeText");

    const closeModalButton = document.getElementById("closeModal");
    const anotherChallengeButton =
        document.getElementById("anotherChallenge");
    const doneChallengeButton =
        document.getElementById("doneChallenge");

    /* save current activity */

    let selectedMood = null;
    let currentChallenge = "";
    let currentCompletionID = null;
    let isDispensing = false;
    let lastMoodButton = null;
    let previousBodyOverflow = "";

    const previousChallenges = {};

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    /* pick random activity */

    function getRandomChallenge(mood) {
        const challenges = vendingChallenges[mood];

        // dont repeat the last activity
        let available = challenges.filter(function (challenge) {
            return challenge !== previousChallenges[mood];
        });

        if (available.length === 0) {
            available = challenges;
        }

        const randomIndex = Math.floor(
            Math.random() * available.length
        );

        const challenge = available[randomIndex];

        previousChallenges[mood] = challenge;

        return challenge;
    }

    function formatMood(mood) {
        return mood.charAt(0).toUpperCase() + mood.slice(1);
    }

    function createCompletionID() {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return window.crypto.randomUUID();
        }

        return (
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2)
        );
    }

    /* show activity */

    function showChallengePopup() {
        challengeText.textContent = currentChallenge;

        modalMoodImage.src = `images/${selectedMood}.png`;
        modalMoodImage.alt = `${formatMood(selectedMood)} mood`;

        doneChallengeButton.disabled = false;
        doneChallengeButton.textContent = "Completed! +2 XP ✓";

        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        challengeModal.hidden = false;

        // stop clicking behind popup
        document.querySelector(".vending-page").inert = true;

        closeModalButton.focus();
    }

    /* close activity */

    function hideChallengePopup(restoreFocus = true) {
        if (challengeModal.hidden) return;

        challengeModal.hidden = true;
        document.body.style.overflow = previousBodyOverflow;

        document.querySelector(".vending-page").inert = false;

        ticket.classList.remove("ticket-drop");

        if (restoreFocus && lastMoodButton) {
            lastMoodButton.focus();
        }
    }

    /* give random activity */

    function dispenseChallenge(mood) {
        if (isDispensing) return;

        if (
            !Object.prototype.hasOwnProperty.call(
                vendingChallenges,
                mood
            ) ||
            vendingChallenges[mood].length === 0
        ) {
            return;
        }

        hideChallengePopup(false);

        isDispensing = true;
        selectedMood = mood;

        currentChallenge = getRandomChallenge(mood);
        currentCompletionID = createCompletionID();

        lastMoodButton = Array.from(moodButtons).find(
            function (button) {
                return button.dataset.mood === mood;
            }
        );

        // move focus to machine
        machine.focus();

        moodButtons.forEach(function (button) {
            const isSelected = button.dataset.mood === mood;

            button.classList.toggle("selected", isSelected);
            button.setAttribute(
                "aria-pressed",
                String(isSelected)
            );

            button.disabled = true;
        });

        machine.setAttribute("aria-busy", "true");

        // restart animation
        machine.classList.remove("dispensing");
        ticket.classList.remove("ticket-drop");

        // refresh animation
        void machine.offsetWidth;

        machine.classList.add("dispensing");

        // play vending machine sound while shaking
        document.dispatchEvent(
            new Event("replay:shake:start")
        );

        const ticketDelay = reducedMotion.matches ? 0 : 1100;
        const popupDelay = reducedMotion.matches ? 100 : 2400;

        window.setTimeout(function () {
            ticket.classList.add("ticket-drop");
        }, ticketDelay);

        window.setTimeout(function () {
            machine.classList.remove("dispensing");

            // stop vending machine sound
            document.dispatchEvent(
                new Event("replay:shake:stop")
            );

            machine.setAttribute("aria-busy", "false");

            moodButtons.forEach(function (button) {
                button.disabled = false;
            });

            isDispensing = false;

            showChallengePopup();
        }, popupDelay);
    }

    /* mood buttons */

    machine.setAttribute("tabindex", "-1");

    moodButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", "false");

        button.addEventListener("click", function () {
            dispenseChallenge(button.dataset.mood);
        });
    });

    /* try another activity */

    anotherChallengeButton.addEventListener(
        "click",
        function () {
            if (!selectedMood || isDispensing) return;

            dispenseChallenge(selectedMood);
        }
    );

    /* give 2 xp */

    doneChallengeButton.addEventListener(
        "click",
        function () {
            if (!currentCompletionID || isDispensing) return;

            if (
                !window.ReplayXP ||
                typeof window.ReplayXP.award !== "function"
            ) {
                window.alert(
                    "XP could not be saved. Make sure xp.js " +
                    "is in your project folder and loads " +
                    "before vending.js."
                );

                return;
            }

            doneChallengeButton.disabled = true;

            try {
                ReplayXP.award(
                    "vending",
                    currentCompletionID
                );

                // stop duplicate xp
                currentCompletionID = null;

                hideChallengePopup();
            } catch (error) {
                doneChallengeButton.disabled = false;

                console.error("Could not save XP.", error);

                window.alert(
                    "Your XP could not be saved. Please try again."
                );
            }
        }
    );

    /* close button */

    closeModalButton.addEventListener("click", function () {
        hideChallengePopup();
    });

    /* close when clicking outside */

    challengeModal.addEventListener("click", function (event) {
        if (event.target === challengeModal) {
            hideChallengePopup();
        }
    });

    /* keyboard controls */

    document.addEventListener("keydown", function (event) {
        if (challengeModal.hidden) return;

        if (event.key === "Escape") {
            event.preventDefault();
            hideChallengePopup();
            return;
        }

        if (event.key !== "Tab") return;

        const focusableButtons = [
            closeModalButton,
            anotherChallengeButton,
            doneChallengeButton
        ].filter(function (button) {
            return !button.disabled;
        });

        const firstButton = focusableButtons[0];
        const lastButton =
            focusableButtons[focusableButtons.length - 1];

        const activeElement = document.activeElement;

        if (
            event.shiftKey &&
            (
                activeElement === firstButton ||
                !challengeModal.contains(activeElement)
            )
        ) {
            event.preventDefault();
            lastButton.focus();
        } else if (
            !event.shiftKey &&
            (
                activeElement === lastButton ||
                !challengeModal.contains(activeElement)
            )
        ) {
            event.preventDefault();
            firstButton.focus();
        }
    });
}

/* start vending machine */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeVendingMachine
    );
} else {
    initializeVendingMachine();
}
