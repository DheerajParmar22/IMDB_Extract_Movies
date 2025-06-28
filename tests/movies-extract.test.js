const { JSDOM } = require("jsdom");

describe("IMDb Scraper Unit Tests", () => {
  const sampleHTML = `
    <html>
      <body>
        <div class="ipc-metadata-list-summary-item">
          <h3 class="ipc-title__text">The Test Movie</h3>
          <div class="dli-title-metadata">
            <span>2023</span>
            <span>2h</span>
          </div>
          <img src="https://example.com/poster.jpg" />
          <a class="ipc-title-link-wrapper" href="/title/tt1234567/"></a>
          <div data-testid="plot">This is a sample plot summary for the movie.</div>
        </div>
      </body>
    </html>
  `;

  test("Parses title, year, and duration correctly", () => {
    const dom = new JSDOM(sampleHTML);
    const document = dom.window.document;
    const item = document.querySelector(".ipc-metadata-list-summary-item");

    const title = item.querySelector("h3")?.textContent.trim() || "N/A";
    const spans = item.querySelectorAll(".dli-title-metadata span");
    const year = spans[0]?.textContent.trim() || "N/A";
    const duration = spans[1]?.textContent.trim() || "N/A";
    const plot =
      item.querySelector('[data-testid="plot"]')?.textContent.trim() || "N/A";
    const poster = item.querySelector("img")?.src || "N/A";
    const link = item.querySelector("a.ipc-title-link-wrapper")?.href;

    expect(title).toBe("The Test Movie");
    expect(year).toBe("2023");
    expect(duration).toBe("2h");
    expect(plot).toMatch(/sample plot/i);
    expect(poster).toBe("https://example.com/poster.jpg");
    expect(link).toBe("/title/tt1234567/");
  });

  test("Handles missing data gracefully", () => {
    const dom = new JSDOM(`<div class="ipc-metadata-list-summary-item"></div>`);
    const item = dom.window.document.querySelector(
      ".ipc-metadata-list-summary-item"
    );

    const title = item.querySelector("h3")?.textContent.trim() || "N/A";
    const year = item.querySelector("span")?.textContent.trim() || "N/A";

    expect(title).toBe("N/A");
    expect(year).toBe("N/A");
  });

  test("Parses JSON-LD movie details", () => {
    const jsonLdContent = {
      "@type": "Movie",
      name: "Test JSON Movie",
      director: { name: "Jane Doe" },
      actor: [{ name: "Actor A" }, { name: "Actor B" }],
      aggregateRating: { ratingValue: "8.7" },
      duration: "PT2H",
      genre: ["Action", "Thriller"],
      description: "Test description from JSON.",
    };

    const jsonLdScript = `
    <script type="application/ld+json">
      ${JSON.stringify(jsonLdContent)}
    </script>
  `;

    const dom = new JSDOM(`<html><body>${jsonLdScript}</body></html>`, {
      contentType: "text/html",
    });

    const scripts = dom.window.document.querySelectorAll("script");
    let details = {};

    for (const script of scripts) {
      if (
        script.type === "application/ld+json" &&
        script.textContent.includes('"@type":"Movie"')
      ) {
        const json = JSON.parse(script.textContent);

        details = {
          title: json.name,
          director: json.director?.name,
          cast: json.actor.map((a) => a.name).join(", "),
          rating: json.aggregateRating?.ratingValue,
          duration: json.duration,
          genre: json.genre.join(", "),
          plot: json.description,
        };
        break;
      }
    }

    expect(details.title).toBe("Test JSON Movie");
    expect(details.director).toBe("Jane Doe");
    expect(details.cast).toBe("Actor A, Actor B");
    expect(details.rating).toBe("8.7");
    expect(details.duration).toBe("PT2H");
    expect(details.genre).toBe("Action, Thriller");
    expect(details.plot).toMatch(/description/i);
  });

  test("Fails gracefully on invalid JSON-LD", () => {
    const badJsonLd = `
      <script type="application/ld+json">{ invalid json }</script>
    `;

    const dom = new JSDOM(`<html><body>${badJsonLd}</body></html>`);
    const script = dom.window.document.querySelector("script");

    let failed = false;
    try {
      JSON.parse(script.textContent);
    } catch (err) {
      failed = true;
    }

    expect(failed).toBe(true);
  });
});
