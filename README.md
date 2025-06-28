# 🎬 IMDb Movie Extractor CLI Tool

This is a Node.js-based CLI tool to extract movies by genre from IMDb. It supports both JSON and CSV output formats, handles pagination, and logs all actions with timestamps. Designed with modularity, testing, and extensibility in mind.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DheerajParmar22/IMDB_Extract_Movies.git
cd imdb-movie-extractor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Project

```bash
node movies-extract.js <genre_name> <number_of_movies_to_extract>
```

### 4. Example

```bash
node movies-extract.js comedy 10
```

### Sample Output (output.json):

```bash
{
  "title": "1. How to Train Your Dragon",
  "releaseYear": "2025",
  "rating": "8.1",
  "directors": "Dean DeBlois",
  "cast": "Mason Thames, Nico Parker, Gerard Butler",
  "plotSummary": "As an ancient threat endangers both Vikings and dragons alike on the isle of Berk, the friendship between Hiccup, an inventive Viking, and Toothless, a Night Fury dragon, becomes the key to both species forging a new future together.",
  "duration": "2h5m",
  "genreTags": "Action, Adventure, Comedy"
}
```

### 5. CSV Output

#### To generate a CSV instead of JSON:

```bash
node movies-extract.js <genre_name> <number_of_movies_to_extract> csv
```

#### This will save output.csv in the same directory.

---

## ⚙️ Tech Stack & Tools

## 🛠️ Tools Used

| Tool   | Purpose                                                                 |
|--------|-------------------------------------------------------------------------|
| `axios` | HTTP client for sending requests to IMDb                                |
| `jsdom` | DOM simulation for parsing IMDb pages (used instead of `cheerio` due to versioning issues) |
| `fs`    | Node.js file system module for reading and writing output files         |
| `yargs` | Command-line argument parser for handling user inputs                   |
| `jest`  | Testing framework used for writing and running unit tests               |


---

## 🧪 Testing

#### Test cases are written using jest and located in:

```bash
tests/movies-extract.test.js
```

#### To run tests:

```bash
npm test
```

---

## 📦 Features

✅ Extracts movie details (title, year, cast, rating, plot, duration, genres)

✅ Handles pagination (25 movies per page)

✅ Supports both JSON and CSV output

✅ Accepts input via command-line or input.js file

✅ Logs all actions and errors in extract.log with timestamps

✅ Modular and testable code

✅ Output capped using <number_of_movies_to_extract> to avoid over-fetching

---

## 🛠️ Future Enhancements

📦 Optional support for SQLite3 (database file prepared, let me know if needed)

🔍 More content manipulation and enhancement support

⚙️ Optional rate-limiting already in place, no need for concurrency for now



