
/* Hobby questionnaire. Wrapped so it can safely initialize after in-page navigation. */
(function () {
"use strict";

const hobbyList = window.REPLAY_HOBBIES || [];

// load saved hobbies
const missedSelections = new Set(
    JSON.parse(localStorage.getItem("replayMissedHobbies") || "[]")
);

const newSelections = new Set(
    JSON.parse(localStorage.getItem("replayNewHobbies") || "[]")
);

/* set up hobby picker */

function setupHobbyPicker(containerId, inputId, selections, storageKey) {

    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);

    const addButton = document.querySelector(
        `.add-hobby[data-target="${containerId}"]`
    );

    // hobby suggestions
    const suggestions = document.createElement("datalist");

    suggestions.id = `${containerId}Suggestions`;

    input.setAttribute("list", suggestions.id);
    input.after(suggestions);

    // save hobbies
    function save() {
        localStorage.setItem(
            storageKey,
            JSON.stringify([...selections])
        );
    }

    // update suggestions
    function updateSuggestions() {

        suggestions.replaceChildren();

        for (const hobby of hobbyList) {

            // skip selected hobbies
            if (selections.has(hobby)) {
                continue;
            }

            const option = document.createElement("option");
            option.value = hobby;

            suggestions.appendChild(option);
        }
    }

    // update button
    function updateButton(button) {

        const chosen = selections.has(button.dataset.hobby);

        button.classList.toggle("selected", chosen);

        button.setAttribute(
            "aria-pressed",
            String(chosen)
        );
    }

    // create hobby button
    function ensureButton(hobby) {

        let button = [...container.querySelectorAll(".hobby-btn")]
            .find(btn =>
                btn.dataset.hobby.toLowerCase() === hobby.toLowerCase()
            );

        // avoid duplicate buttons
        if (!button) {

            button = document.createElement("button");

            button.type = "button";
            button.className = "hobby-btn";
            button.dataset.hobby = hobby;
            button.textContent = hobby;

            container.appendChild(button);
        }

        updateButton(button);
    }

    // load previous hobbies
    selections.forEach(ensureButton);

    container.querySelectorAll(".hobby-btn").forEach(updateButton);

    updateSuggestions();

    // select or remove hobbies
    container.addEventListener("click", event => {

        const button = event.target.closest(".hobby-btn");

        if (!button || !container.contains(button)) {
            return;
        }

        const hobby = button.dataset.hobby;

        if (selections.has(hobby)) {
            selections.delete(hobby);
        } else {
            selections.add(hobby);
        }

        updateButton(button);

        save();

        // refresh suggestions
        updateSuggestions();
    });

    // add searched hobby
    function addTypedHobby() {

        const typed = input.value.trim();

        if (!typed) {
            return;
        }

        // find hobby
        const hobby = hobbyList.find(
            item => item.toLowerCase() === typed.toLowerCase()
        );

        if (!hobby) {
            alert("Please choose a hobby from the suggestions.");
            return;
        }

        // avoid duplicates
        if (selections.has(hobby)) {

            input.value = "";

            updateSuggestions();

            return;
        }

        // add hobby
        selections.add(hobby);

        ensureButton(hobby);

        save();

        // update suggestions
        updateSuggestions();

        // clear search
        input.value = "";
    }

    // add button
    addButton.addEventListener("click", addTypedHobby);

    // enter to add hobby
    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            addTypedHobby();
        }
    });
}

/* set up both questions */

setupHobbyPicker(
    "missedHobbies",
    "missedOther",
    missedSelections,
    "replayMissedHobbies"
);

setupHobbyPicker(
    "newHobbies",
    "newOther",
    newSelections,
    "replayNewHobbies"
);

/* continue to challenges */

document.getElementById("hobbiesContinue").addEventListener("click", () => {

    // choose at least one hobby
    if (missedSelections.size === 0 && newSelections.size === 0) {

        alert("Please select at least one hobby!");

        return;
    }

    // go to challenges
    if (window.REPLAY && typeof window.REPLAY.navigateTo === "function") {
        window.REPLAY.navigateTo("challenges.html");
    } else {
        window.location.href = "challenges.html";
    }
});

})();
