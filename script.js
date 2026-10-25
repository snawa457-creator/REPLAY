(function () {
    "use strict";

    function setupNicknamePage() {
        const continueButton = document.getElementById("continueButton");
        const nicknameInput = document.getElementById("nicknameInput");

        if (!continueButton || !nicknameInput || continueButton.dataset.replayBound === "true") return;

        continueButton.dataset.replayBound = "true";

        try {
            nicknameInput.value = localStorage.getItem("replayNickname") || "";
        } catch (_) {}

        function continueToQuestions(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            const nickname = nicknameInput.value.trim();

            if (!nickname) {
                alert("Please enter a nickname!");
                nicknameInput.focus();
                return;
            }

            let oldNickname = "";

            try {
                oldNickname = localStorage.getItem("replayNickname") || "";

                if (oldNickname !== nickname) {
                    // A different nickname starts a new player profile.
                    // Reset XP, trophies, challenge progress, and questionnaire .

                    [
                        "replayXPState",
                        "replayTrophyProgress",
                        "replayNewTrophy",
                        "replayCurrentChallenges",
                        "replayCompletedChallenges",
                        "replayChallengeHistory",
                        "replayMissedHobbies",
                        "replayNewHobbies"
                    ].forEach(key => localStorage.removeItem(key));
                }

                localStorage.setItem("replayNickname", nickname);

            } catch (error) {
            
                console.warn(
                    "RE:PLAY could not save the nickname in this browser.",
                    error
                );
            }

            const nextPage = new URL(
                "questions.html",
                window.location.href
            ).href;

            if (
                window.REPLAY &&
                typeof window.REPLAY.navigateTo === "function"
            ) {
            
                window.REPLAY.navigateTo(nextPage);

            } else {
                window.location.assign(nextPage);
            }
        }

        continueButton.addEventListener(
            "click",
            continueToQuestions
        );

        nicknameInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                continueToQuestions(event);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            setupNicknamePage,
            { once: true }
        );
    } else {
        setupNicknamePage();
    }

    document.addEventListener(
        "replay:pagechange",
        setupNicknamePage
    );
})();
