
(function () {
"use strict";

/* trophy list */

const trophies = [
    {
        id: "running",
        name: "Running",
        locked: "empty_trophy.png",
        unlocked: "shoe_trophy.png",
        required: 3
    },
    {
        id: "reading",
        name: "Reading",
        locked: "empty_trophy.png",
        unlocked: "book_trophy.png",
        required: 3
    },
    {
        id: "photography",
        name: "Photography",
        locked: "empty_trophy.png",
        unlocked: "camera_trophy.png",
        required: 3
    },
    {
        id: "music",
        name: "Music",
        locked: "empty_trophy.png",
        unlocked: "headphones_trophy.png",
        required: 3
    },
    {
        id: "painting",
        name: "Painting",
        locked: "empty_trophy.png",
        unlocked: "paint_trophy.png",
        required: 3
    },
    {
        id: "gardening",
        name: "Gardening",
        locked: "empty_trophy.png",
        unlocked: "plant_trophy.png",
        required: 3
    }
];

/* load saved progress */

let trophyProgress = {};

try {
    trophyProgress = JSON.parse(
        localStorage.getItem("replayTrophyProgress") || "{}"
    );
} catch {
    trophyProgress = {};
}

/* Pink trophy notification */

const trophyNotificationKey = "replayNewTrophy";

function updateTrophyNotification() {
    const trophyIcon = document.querySelector(".trophy-link");
    const trophyCase = document.getElementById("trophyGrid");

    // Opening the trophy case clears the notification.
    if (trophyCase) {
        localStorage.removeItem(trophyNotificationKey);
    }

    if (trophyIcon) {
        const hasNewTrophy =
            localStorage.getItem(trophyNotificationKey) === "true";

        trophyIcon.classList.toggle(
            "has-new-trophy",
            hasNewTrophy
        );
    }
}

/* save progress */

function saveTrophyProgress() {
    try {
        localStorage.setItem(
            "replayTrophyProgress",
            JSON.stringify(trophyProgress)
        );
    } catch (error) {
        console.warn("Could not save trophy progress.", error);
    }
}

/* complete challenge */

function recordTrophyChallenge(hobby, completionID) {
    if (!hobby || !completionID) return;

    const normalizedHobby = hobby.trim().toLowerCase();

    const aliases = {
        "jogging": "running",
        "books": "reading",
        "taking photos": "photography",
        "photographing": "photography",
        "playing music": "music",
        "gardening/plants": "gardening"
    };

    const matchName =
        aliases[normalizedHobby] || normalizedHobby;

    const trophy = trophies.find(item =>
        item.name.toLowerCase() === matchName ||
        item.id.toLowerCase() === matchName
    );

    if (!trophy) return;

    if (!Array.isArray(trophyProgress[trophy.id])) {
        trophyProgress[trophy.id] = [];
    }

    // dont count twice
    if (trophyProgress[trophy.id].includes(completionID)) {
        return;
    }


const previousCount = trophyProgress[trophy.id].length;

trophyProgress[trophy.id].push(completionID);

// Show notification only when a trophy becomes unlocked.
if (
    previousCount < trophy.required &&
    trophyProgress[trophy.id].length >= trophy.required
) {
    localStorage.setItem(trophyNotificationKey, "true");
    updateTrophyNotification();
}

    saveTrophyProgress();
    displayTrophies();
}

/* check unlocked trophies */

function isTrophyUnlocked(trophy) {
    const completed = trophyProgress[trophy.id] || [];

    return completed.length >= trophy.required;
}

/* show trophy case */

function displayTrophies() {
    const grid = document.getElementById("trophyGrid");
    const counter = document.getElementById("trophyCount");

    if (!grid) return;

    grid.innerHTML = "";

    let unlockedCount = 0;

    trophies.forEach(function(trophy) {
        const unlocked = isTrophyUnlocked(trophy);

        if (unlocked) unlockedCount++;

        const completed = trophyProgress[trophy.id] || [];

        const image = unlocked
            ? trophy.unlocked
            : trophy.locked;

        const status = unlocked
            ? "Unlocked!"
            : `${Math.min(completed.length, trophy.required)} / ${trophy.required} challenges`;

        const item = document.createElement("div");

        item.className = unlocked
            ? "trophy-item unlocked"
            : "trophy-item locked";

        // trophy image
        const trophyImage = `
            <img src="images/${image}" alt="${trophy.name} trophy">
        `;

        // link running trophy to game
        const trophyDisplay =
            trophy.id === "running" && unlocked
                ? `<a href="running.html" class="trophy-game-link" aria-label="Play running game">${trophyImage}</a>`
                : trophyImage;

        // show trophy
        item.innerHTML = `
            ${trophyDisplay}
            <div class="trophy-name">${trophy.name}</div>
            <div class="trophy-status">${status}</div>
            <div class="trophy-shelf"></div>
        `;

        grid.appendChild(item);
    });

    if (counter) {
        counter.textContent =
            `${unlockedCount} / ${trophies.length} trophies unlocked`;
    }
}

/* share trophy functions */

window.ReplayTrophies = {
    record: recordTrophyChallenge,
    render: displayTrophies
};

/* load and refresh trophy case */

displayTrophies();

window.addEventListener("pageshow", displayTrophies);

window.addEventListener("storage", function (event) {
    if (
        event.key === "replayTrophyProgress" ||
        event.key === null
    ) {
        try {
            trophyProgress = JSON.parse(
                localStorage.getItem("replayTrophyProgress") || "{}"
            );
        } catch (_) {
            trophyProgress = {};
        }

        displayTrophies();
    }
});

document.addEventListener(
    "replay:pagechange",
    displayTrophies
);


// Check the notification when a page loads.
updateTrophyNotification();

// Keep the notification updated during navigation.
document.addEventListener(
    "replay:pagechange",
    updateTrophyNotification
);

})();
