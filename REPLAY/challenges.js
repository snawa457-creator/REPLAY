/* saving player details */

const nickname =
    localStorage.getItem("replayNickname") || "Player";

const missedHobbies = JSON.parse(
    localStorage.getItem("replayMissedHobbies") || "[]"
);

const newHobbies = JSON.parse(
    localStorage.getItem("replayNewHobbies") || "[]"
);

const selectedHobbies = [
    ...new Set([...missedHobbies, ...newHobbies])
];

/* page elements */

const challengeGreeting =
    document.getElementById("challengeGreeting");

const challengeList =
    document.getElementById("challengeList");

const challengeProgress =
    document.getElementById("challengeProgress");

/* name + heading */

challengeGreeting.textContent =
    `${nickname}'s Daily Challenges`;

/* storage */

const currentKey = "replayCurrentChallenges";
const completedKey = "replayCompletedChallenges";
const historyKey = "replayChallengeHistory";

/* saving progress */

let completedChallenges = JSON.parse(
    localStorage.getItem(completedKey) || "[]"
);

let challengeHistory = JSON.parse(
    localStorage.getItem(historyKey) || "[]"
);

let currentChallenges = JSON.parse(
    localStorage.getItem(currentKey) || "[]"
);

let generating = false;

/* challenge stuff */

const allChallenges = [];

selectedHobbies.forEach(function (hobby) {
    const tasks = challengeDatabase[hobby] || [
        `Spend 10 minutes trying ${hobby.toLowerCase()}.`,
        `Learn one new technique related to ${hobby.toLowerCase()}.`,
        `Find inspiration for a ${hobby.toLowerCase()} project.`,
        `Try a small ${hobby.toLowerCase()} activity today.`
    ];

    tasks.forEach(function (task, index) {
        allChallenges.push({
            id: `${hobby}-${index}`,
            hobby: hobby,
            text: task
        });
    });
});

/* array shuffle */

function shuffleChallenges(challenges) {
    const shuffled = [...challenges];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(
            Math.random() * (i + 1)
        );

        const temporary = shuffled[i];

        shuffled[i] = shuffled[randomIndex];
        shuffled[randomIndex] = temporary;
    }

    return shuffled;
}

/* three challenges being generated */

function generateChallenges() {
    if (allChallenges.length === 0) {
        generating = false;

        challengeList.textContent =
            "Choose some hobbies first to unlock your challenges!";

        challengeProgress.textContent = "";

        return;
    }

    let available = allChallenges.filter(function (challenge) {
        return !challengeHistory.includes(challenge.id);
    });

    const numberToChoose = Math.min(3, allChallenges.length);

    // start a new rotation when too few unseen tasks remain
    if (available.length < numberToChoose) {
        challengeHistory = [];
        available = [...allChallenges];
    }

    currentChallenges = shuffleChallenges(available)
        .slice(0, numberToChoose)
        .map(function (challenge) {
            return {
                ...challenge,
                completed: false
            };
        });

    challengeHistory.push(
        ...currentChallenges.map(function (challenge) {
            return challenge.id;
        })
    );

    localStorage.setItem(
        currentKey,
        JSON.stringify(currentChallenges)
    );

    localStorage.setItem(
        historyKey,
        JSON.stringify(challengeHistory)
    );

    generating = false;

    displayChallenges();
}

/* checklist display */

function displayChallenges() {
    challengeList.innerHTML = "";

    currentChallenges.forEach(function (challenge) {
        const label = document.createElement("label");

        label.className = "challenge-card";

        if (challenge.completed) {
            label.classList.add("completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = challenge.completed;
        checkbox.disabled = generating;

        const details = document.createElement("div");

        const hobbyName = document.createElement("span");

        hobbyName.className = "challenge-hobby";
        hobbyName.textContent = challenge.hobby;

        const challengeText = document.createElement("span");

        challengeText.className = "challenge-text";
        challengeText.textContent = challenge.text;

        details.appendChild(hobbyName);
        details.appendChild(challengeText);

        label.appendChild(checkbox);
        label.appendChild(details);

        checkbox.addEventListener("change", function () {
            completeChallenge(
                challenge.id,
                checkbox.checked,
                checkbox
            );
        });

        challengeList.appendChild(label);
    });

    updateProgress();
}

/* finish or uncheck challenge */

function completeChallenge(id, checked, checkbox) {
    if (generating) return;

    const challenge = currentChallenges.find(function (item) {
        return item.id === id;
    });

    if (!challenge) return;

    // giving XP before changing the saved completion state
    if (checked) {
        if (
            !window.ReplayXP ||
            typeof window.ReplayXP.award !== "function"
        ) {
            checkbox.checked = challenge.completed;

            window.alert(
                "XP could not be saved. Make sure xp.js " +
                "loads before challenges.js."
            );

            return;
        }

        const completionID =
            `${ReplayXP.localDate()}:${challenge.id}`;

        try {
            // the shared XP system prevents duplicate rewards
            ReplayXP.award("daily", completionID);
        } catch (error) {
            checkbox.checked = challenge.completed;

            console.error("Could not save XP.", error);

            window.alert(
                "Your XP could not be saved. Please try again."
            );

            return;
        }
    }

    challenge.completed = checked;

    if (checked && !completedChallenges.includes(id)) {
        completedChallenges.push(id);
    }

    localStorage.setItem(
        completedKey,
        JSON.stringify(completedChallenges)
    );

    localStorage.setItem(
        currentKey,
        JSON.stringify(currentChallenges)
    );

    // Update the existing card so keyboard focus stays in place
    checkbox.closest(".challenge-card").classList.toggle(
        "completed",
        checked
    );

    updateProgress();

    const allDone = currentChallenges.every(function (item) {
        return item.completed;
    });

    if (allDone) {
        generating = true;

        challengeList
            .querySelectorAll('input[type="checkbox"]')
            .forEach(function (input) {
                input.disabled = true;
            });

        challengeProgress.textContent =
            "Amazing! Unlocking your next challenges...";

        window.setTimeout(function () {
            generateChallenges();
        }, 1200);
    }
}

/* update checklist progress*/

function updateProgress() {
    const completedCount = currentChallenges.filter(
        function (challenge) {
            return challenge.completed;
        }
    ).length;

    challengeProgress.textContent =
        `${completedCount} / ${currentChallenges.length} completed`;
}

/* initialize page */

if (selectedHobbies.length === 0) {
    challengeList.textContent =
        "You haven't selected any hobbies yet!";

    const link = document.createElement("a");

    link.href = "questions.html";
    link.textContent = "Choose your hobbies →";

    challengeList.appendChild(document.createElement("br"));
    challengeList.appendChild(link);

    challengeProgress.textContent = "";
} else if (
    currentChallenges.length === 0 ||
    currentChallenges.some(function (item) {
        return !allChallenges.some(function (challenge) {
            return challenge.id === item.id;
        });
    })
) {
    generateChallenges();
} else if (
    currentChallenges.every(function (item) {
        return item.completed;
    })
) {
    generateChallenges();
} else {
    displayChallenges();
}