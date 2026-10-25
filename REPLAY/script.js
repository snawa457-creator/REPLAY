
/* nickname page */

const continueButton = document.getElementById("continueButton");
const nicknameInput = document.getElementById("nicknameInput");

if (continueButton && nicknameInput) {

    // load saved nickname
    nicknameInput.value =
        localStorage.getItem("replayNickname") || "";

    // continue to questions
    function continueToQuestions() {
        const nickname = nicknameInput.value.trim();

        if (nickname === "") {
            alert("Please enter a nickname!");
            return;
        }

        const oldNickname =
            localStorage.getItem("replayNickname");

        // reset progress for a different nickname
        if (oldNickname !== nickname) {

            localStorage.removeItem("replayXPState");
            localStorage.removeItem("replayTrophyProgress");

            localStorage.removeItem("replayCurrentChallenges");
            localStorage.removeItem("replayCompletedChallenges");
            localStorage.removeItem("replayChallengeHistory");

            localStorage.removeItem("replayMissedHobbies");
            localStorage.removeItem("replayNewHobbies");
        }

        // save nickname
        localStorage.setItem("replayNickname", nickname);

        window.location.href = "questions.html";
    }

    continueButton.addEventListener("click", continueToQuestions);

    // press enter to continue
    nicknameInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            continueToQuestions();
        }
    });
}
