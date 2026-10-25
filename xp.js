

(function () {
    "use strict";

    const storageKey = "replayXPState";

    const points = {
        daily: 1,
        vending: 2
    };

    /* read saved xp */

    function readState() {
        const savedText = localStorage.getItem(storageKey);

        if (savedText === null) {
            return {
                total: 0,
                awards: []
            };
        }

        const saved = JSON.parse(savedText);

        if (
            !saved ||
            !Number.isSafeInteger(saved.total) ||
            saved.total < 0 ||
            !Array.isArray(saved.awards) ||
            !saved.awards.every(function (award) {
                return typeof award === "string";
            })
        ) {
            throw new Error("Saved XP data is invalid.");
        }

        return saved;
    }

    /* local date */

    function localDate() {
        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    /* levels */

    function getLevelProgress(total) {
        if (total < 20) {
            return {
                level: 1,
                start: 0,
                target: 20
            };
        }

        if (total < 50) {
            return {
                level: 2,
                start: 20,
                target: 50
            };
        }

        return {
            level: 3,
            start: 50,
            target: 100
        };
    }

    /* xp bar update*/

    function renderBar() {
        const bar = document.getElementById("xpBar");

        // only the daily challenges page contains the bar
        if (!bar) return;

        const levelLabel = document.getElementById("xpLevel");
        const xpText = document.getElementById("xpText");
        const track = document.getElementById("xpTrack");

        if (!levelLabel || !xpText || !track) return;

        let state;

        try {
            state = readState();
        } catch (error) {
            console.error("Could not read saved XP.", error);

            xpText.textContent = "XP unavailable";

            return;
        }

        const total = state.total;
        const progress = getLevelProgress(total);
        const allComplete = total >= 100;

        const percentage = Math.min(
            100,
            Math.max(
                0,
                (
                    (total - progress.start) /
                    (progress.target - progress.start)
                ) * 100
            )
        );

        // Moves both the green liquid and the logo
        bar.style.setProperty(
            "--xp-progress",
            `${percentage}%`
        );

        levelLabel.textContent = allComplete
            ? "ALL LEVELS COMPLETE!"
            : `LEVEL ${progress.level}`;

        xpText.textContent = allComplete
            ? `${total} XP`
            : `${total} / ${progress.target} XP`;

        track.setAttribute(
            "aria-valuemin",
            String(progress.start)
        );

        track.setAttribute(
            "aria-valuemax",
            String(progress.target)
        );

        track.setAttribute(
            "aria-valuenow",
            String(Math.min(total, progress.target))
        );

        track.setAttribute(
            "aria-valuetext",
            allComplete
                ? `${total} XP. All three levels complete.`
                : (
                    `Level ${progress.level}. ` +
                    `${total} total XP. ` +
                    `Next milestone ${progress.target} XP.`
                )
        );
    }

    /* xp award once */

    function awardXP(type, completionID) {
        if (
            !Object.prototype.hasOwnProperty.call(points, type) ||
            typeof completionID !== "string" ||
            completionID.trim() === ""
        ) {
            return false;
        }

        const state = readState();
        const awardID = `${type}:${completionID}`;

        // repeated clicks cannot reward the same completion twice
        if (state.awards.includes(awardID)) {
            renderBar();
            return false;
        }

        const nextTotal = state.total + points[type];

        if (!Number.isSafeInteger(nextTotal)) {
            throw new Error("XP total is too large.");
        }

        state.total = nextTotal;
        state.awards.push(awardID);

        // Save before updating the display
        localStorage.setItem(
            storageKey,
            JSON.stringify(state)
        );

        renderBar();

        return true;
    }

    window.ReplayXP = {
        award: awardXP,
        localDate: localDate,
        render: renderBar
    };

    /* update when different tab changes xp */

    window.addEventListener("storage", function (event) {
        if (
            event.key === storageKey ||
            event.key === null
        ) {
            renderBar();
        }
    });

    /* update to return page */

    window.addEventListener("pageshow", renderBar);

    /* initial display */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            renderBar
        );
    } else {
        renderBar();
    }
})();