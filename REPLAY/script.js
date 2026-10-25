
/* nickname page */

// continue button
const continueButton = document.getElementById("continueButton");

// nickname input
const nicknameInput = document.getElementById("nicknameInput");

// check nickname page
if (continueButton && nicknameInput) {

    // load saved nickname
    nicknameInput.value =
        localStorage.getItem("replayNickname") || "";

    // continue button clicked
    continueButton.addEventListener("click", function() {

        // get nickname
        const nickname = nicknameInput.value.trim();

        // check nickname
        if (nickname === "") {
            alert("Please enter a nickname!");
            return;
        }

        // save nickname
        localStorage.setItem("replayNickname", nickname);

        // go to questions
        window.location.href = "questions.html";

    });

    // press enter to continue
    nicknameInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            continueButton.click();
        }
    });

}
