/* Community Volunteer Coordination Platform - opportunity search add-on.
   Works with the existing app.js that renders opportunity cards into #opportunityList.
   No database changes or additional packages required. */
(function () {
  "use strict";

  function setupOpportunitySearch() {
    const list = document.getElementById("opportunityList");
    if (!list || document.getElementById("opportunitySearch")) return;

    const panel = document.createElement("section");
    panel.className = "card";
    panel.setAttribute("aria-label", "Search volunteer opportunities");
    panel.style.cssText = "margin-bottom:18px;padding:18px;";

    const label = document.createElement("label");
    label.setAttribute("for", "opportunitySearch");
    label.textContent = "Find volunteer opportunities";
    label.style.cssText = "display:block;font-weight:600;margin-bottom:8px;";

    const search = document.createElement("input");
    search.id = "opportunitySearch";
    search.type = "search";
    search.placeholder = "Search by opportunity, organisation or location";
    search.autocomplete = "off";
    search.style.cssText = "box-sizing:border-box;width:100%;padding:12px 14px;border:1px solid #b7bcc5;border-radius:8px;font:inherit;";
    search.setAttribute("aria-describedby", "opportunitySearchCount");

    const counter = document.createElement("p");
    counter.id = "opportunitySearchCount";
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    counter.style.cssText = "margin:9px 0 0;font-size:.9rem;opacity:.8;";

    const noMatches = document.createElement("p");
    noMatches.textContent = "No opportunities match your search. Try another keyword.";
    noMatches.className = "empty";
    noMatches.hidden = true;
    noMatches.style.cssText = "display:none;margin-top:12px;";

    panel.append(label, search, counter);
    list.parentNode.insertBefore(panel, list);
    list.insertAdjacentElement("afterend", noMatches);

    function applyFilter() {
      const queryWords = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const cards = Array.from(list.querySelectorAll(".item"));
      let count = 0;
      for (const card of cards) {
        const haystack = (card.textContent || "").toLocaleLowerCase();
        const matches = queryWords.every((word) => haystack.includes(word));
        card.style.display = matches ? "" : "none";
        if (matches) count += 1;
      }
      counter.textContent = cards.length
        ? `${count} of ${cards.length} opportunit${cards.length === 1 ? "y" : "ies"} shown`
        : "";
      const showMessage = cards.length > 0 && count === 0;
      noMatches.hidden = !showMessage;
      noMatches.style.display = showMessage ? "block" : "none";
    }

    search.addEventListener("input", applyFilter);
    // Existing app.js fills #opportunityList asynchronously after requesting the API.
    // Reapply any search term when the cards are loaded or refreshed.
    const observer = new MutationObserver(applyFilter);
    observer.observe(list, { childList: true });
    applyFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupOpportunitySearch);
  } else {
    setupOpportunitySearch();
  }
})();
