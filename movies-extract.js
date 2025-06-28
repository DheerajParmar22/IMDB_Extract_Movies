const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.imdb.com";
const LOG_FILE = "extract.log";

// these are log helpers
const timestamp = () => new Date().toISOString();
const log = (msg) => {
  const line = `[${timestamp()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
};
const errorLog = (msg) => log(`ERROR: ${msg}`);

// here's the delay between requests to avoid the rate-limiting
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const scrapeMovies = async (genre, maxCount) => {
  let page = 1;
  const movies = [];

  while (movies.length < maxCount) {
    const url = `${BASE_URL}/search/title/?genres=${genre}&start=${
      (page - 1) * 50 + 1
    }&ref_=adv_nxt`;

    let data;
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        }, // this header act as a browser to avoid blocking
      });
      data = response.data;
    } catch (err) {
      errorLog(`Failed to fetch list page ${page}: ${err.message}`);
      break;
    }

    let document;
    try {
      const dom = new JSDOM(data);
      document = dom.window.document;
    } catch (err) {
      errorLog(`JSDOM error on page ${page}: ${err.message}`);
      break;
    }

    const movieElements = document.querySelectorAll(
      ".ipc-metadata-list-summary-item"
    );
    if (movieElements.length === 0) {
      log(`No more movies found on page ${page}.`);
      break;
    }

    for (const element of movieElements) {
      if (movies.length >= maxCount) break;

      try {
        const title = element.querySelector("h3")?.textContent.trim() || "N/A";
        const metadataElements = element.querySelectorAll(
          ".dli-title-metadata span"
        );
        const releaseYear = metadataElements[0]?.textContent.trim() || "N/A";
        const plotElement =
          element.querySelector(".ipc-html-content-inner-div") ||
          element.querySelector('[data-testid="plot"]');
        const plotSummary = plotElement?.textContent.trim() || "N/A";
        const durationFromList =
          metadataElements[1]?.textContent.trim() || "N/A";
        const linkElement = element.querySelector("a.ipc-title-link-wrapper");
        const detailURL = linkElement?.href
          ? `${BASE_URL}${linkElement.href}`
          : null;

        let rating = "N/A";
        let directors = "N/A";
        let cast = "N/A";
        let duration = durationFromList;
        let genreTags = "N/A";

        if (detailURL) {
          try {
            await delay(200); // this delay to avoid rate-limiting
            const detailResponse = await axios.get(detailURL, {
              headers: {
                "User-Agent": "Mozilla/5.0",
              },
            });
            const detailDOM = new JSDOM(detailResponse.data);
            const scripts =
              detailDOM.window.document.querySelectorAll("script");

            for (const script of scripts) {
              if (
                script.type === "application/ld+json" &&
                script.textContent.includes('"@type":"Movie"') // I would not get directors and cast details if this condition is not found because it is getting data from the movie details icon-popup
              ) {
                let json;
                try {
                  json = JSON.parse(script.textContent);
                } catch (err) {
                  errorLog(`JSON parse error at ${detailURL}`);
                  break;
                }

                directors = Array.isArray(json.director)
                  ? json.director.map((d) => d.name).join(", ")
                  : json.director?.name || "N/A";

                cast = Array.isArray(json.actor)
                  ? json.actor.map((a) => a.name).join(", ")
                  : "N/A";

                rating = json.aggregateRating?.ratingValue?.toString() || "N/A";
                duration = json.duration
                  ? json.duration.replace("PT", "").toLowerCase()
                  : duration;
                genreTags = Array.isArray(json.genre)
                  ? json.genre.join(", ")
                  : json.genre || "N/A";

                break;
              }
            }
          } catch (err) {
            errorLog(`Failed to fetch details: ${detailURL} —> ${err.message}`);
          }
        }

        movies.push({
          title,
          releaseYear,
          rating,
          directors,
          cast,
          plotSummary,
          duration,
          genreTags,
        });

        log(`Extracted ${movies.length}/${maxCount}: ${title}`);
      } catch (err) {
        errorLog(`Failed to parse movie on page ${page}: ${err.message}`);
        continue;
      }
    }
    page++;
  }
  return movies;
};

const saveToFile = (data, format = "json") => {
  try {
    if (format === "json") {
      fs.writeFileSync("output.json", JSON.stringify(data, null, 2), "utf-8");
      log("File saved to output.json");
    } else if (format === "csv") {
      const csv = [
        [
          "title",
          "releaseYear",
          "rating",
          "duration",
          "genreTags",
          "plotSummary",
          "directors",
          "cast",
        ].join(","),
        ...data.map((m) =>
          [
            `"${m.title}"`,
            m.releaseYear,
            m.rating,
            m.duration,
            `"${m.genreTags}"`,
            `"${m.plotSummary.replace(/"/g, "'")}"`,
            `"${m.directors}"`,
            `"${m.cast}"`,
          ].join(",")
        ),
      ].join("\n");

      fs.writeFileSync("output.csv", csv, "utf-8");
      log("File saved to output.csv");
    }
  } catch (err) {
    errorLog(`Failed to save file: ${err.message}`);
  }
};

const main = async () => {
  const genre = process.argv[2];
  const maxCount = parseInt(process.argv[3]);
  const format = process.argv[4] === "csv" ? "csv" : "json";

  if (!genre || isNaN(maxCount) || maxCount <= 0) {
    errorLog(
      "Usage: node movie-extract.js <genre> <count> [csv]\nExample: node movie-extract.js comedy 50 csv"
    );
    process.exit(1);
  }

  try {
    const movies = await scrapeMovies(genre, maxCount);
    saveToFile(movies, format);
  } catch (error) {
    errorLog(`Fatal error: ${error.message}`);
  }
};

main();
