
/* Keeps music on while going between HTML pages. */
(function () {
    "use strict";
    let navigating = false;

    function isLocalHtmlLink(link) {
        if (!link || !link.href || link.target || link.hasAttribute("download")) return false;
        if (link.origin !== window.location.origin) return false;
        if (!/\.html?$/i.test(new URL(link.href).pathname)) return false;
        if (link.pathname === window.location.pathname && link.hash) return false;
        return true;
    }

    async function navigate(url, pushState) {
        if (navigating) return;
        navigating = true;

        try {
            const response = await fetch(url, {
                headers: { "X-REPLAY-Navigation": "1" }
            });

            if (!response.ok) {
                throw new Error("Page could not be loaded");
            }

            const html = await response.text();
            const parsed = new DOMParser().parseFromString(
                html,
                "text/html"
            );

            const nextPath = new URL(url, location.href);

            document.querySelectorAll(
                'link[rel="stylesheet"][data-replay-page-style="true"]'
            ).forEach(el => el.remove());

            const incomingStyles = Array.from(
                parsed.querySelectorAll('link[rel="stylesheet"]')
            );

            for (const oldLink of incomingStyles) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = new URL(
                    oldLink.getAttribute("href"),
                    nextPath
                ).href;

                link.dataset.replayPageStyle = "true";
                document.head.appendChild(link);
            }

            document.title = parsed.title || "RE:PLAY";
            document.body.className = parsed.body.className;

            const audioToggle = document.querySelector(
                ".replay-audio-toggle"
            );

            if (audioToggle) {
                audioToggle.remove();
            }

            document.body.innerHTML = parsed.body.innerHTML;

            if (audioToggle) {
                document.body.appendChild(audioToggle);
            }

            if (pushState) {
                history.pushState(
                    { replay: true },
                    "",
                    nextPath.href
                );
            }

            window.scrollTo(0, 0);

            const scripts = Array.from(
                parsed.querySelectorAll("script")
            );

            for (const oldScript of scripts) {
                const src = oldScript.getAttribute("src");

                if (
                    src &&
                    /(^|\/)(audio|navigation)\.js(?:$|\?)/i.test(src)
                ) {
                    continue;
                }

                const script = document.createElement("script");

                if (src) {
                    script.src = new URL(src, nextPath).href;
                    script.async = false;

                    await new Promise((resolve) => {
                        script.onload = resolve;
                        script.onerror = resolve;
                        document.body.appendChild(script);
                    });
                } else {
                    script.textContent = oldScript.textContent;
                    document.body.appendChild(script);
                }
            }

            document.dispatchEvent(
                new CustomEvent("replay:pagechange", {
                    detail: { url: nextPath.href }
                })
            );

        } catch (error) {

            location.href = url;
        } finally {
            navigating = false;
        }
    }

    window.REPLAY = window.REPLAY || {};

    window.REPLAY.navigateTo = function (url) {
        return navigate(url, true);
    };

    document.addEventListener("click", function (event) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        const link = event.target.closest("a");

        if (!isLocalHtmlLink(link)) {
            return;
        }

        event.preventDefault();
        navigate(link.href, true);
    });

    window.addEventListener("popstate", function () {
        navigate(location.href, false);
    });
})();
