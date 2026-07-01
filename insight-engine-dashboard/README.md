# Insight Engine — Training Feedback Dashboard

A containerized web dashboard plus Power BI scripts for exploring training
feedback (`insight_engine_fake_training_feedback(in).csv`, 100 responses).

## What's inside

```
insight-engine-dashboard/
├── web/                 # the dashboard (static HTML/CSS/JS + Chart.js)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── data.js          # generated from the CSV — do not edit by hand
├── data/feedback.csv    # source data (copied from Downloads)
├── powerbi/             # Power Query (M) + DAX scripts  (see powerbi/README.md)
├── Dockerfile           # nginx image serving web/
├── nginx.conf
├── docker-compose.yml
├── generate-data.ps1    # regenerates web/data.js from the CSV
└── .dockerignore
```

## Run with Docker

Requires **Docker Desktop** (not currently installed on this machine — install it first).

```powershell
cd C:\Users\jxh0jpg\insight-engine-dashboard
docker compose up --build -d
```

Then open **http://localhost:8080**.

Stop it with:

```powershell
docker compose down
```

### Without compose

```powershell
docker build -t insight-engine-dashboard .
docker run -d --name insight-engine-dashboard -p 8080:80 insight-engine-dashboard
```

## Preview without Docker

The dashboard is fully static, so you can also just open `web/index.html` in a
browser. (Chart.js loads from a CDN, so an internet connection is needed either
way unless you vendor it locally.)

## Dashboard features

- **KPI strip** — response count, average rating, positive/negative share, top theme.
- **Charts** — avg rating by training, sentiment mix, theme frequency, rating
  distribution, sentiment by business unit (stacked), delivery format.
- **Filters** — training, business unit, sentiment; all charts + table update live.
- **Response table** — searchable and sortable, with sentiment pills and suggested actions.

## Updating the data

If the CSV changes, regenerate the baked-in `web/data.js` and rebuild:

```powershell
.\generate-data.ps1
docker compose up --build -d
```

## Power BI

See [`powerbi/README.md`](powerbi/README.md) for the Power Query (M) loader and
DAX measures that reproduce the same analytics in Power BI Desktop.
