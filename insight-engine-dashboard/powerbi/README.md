# Power BI Scripts

Two scripts to reproduce the dashboard analytics in **Power BI Desktop** against
`insight_engine_fake_training_feedback(in).csv`.

| File | Language | Purpose |
|------|----------|---------|
| `01_load_feedback.m` | Power Query (M) | Load the CSV, set types, add derived columns (`SentimentScore`, `SessionMonth`, `YearMonth`, `RatingBucket`). |
| `02_measures.dax` | DAX | Reusable measures (ratings, sentiment share, net sentiment, CSAT buckets, top/lowest performers) + a suggested visual layout. |

## Steps

1. **Load & shape** — Power BI Desktop → **Home → Transform data** → **New Source → Blank Query** → **Advanced Editor**. Paste `01_load_feedback.m`, rename the query to `Feedback`, fix `SourcePath` if needed, then **Close & Apply**.
   - The `SessionDate` column expects US `m/d/yyyy`. If parsing fails, set the report locale to **English (United States)** under *File → Options → Regional settings → Locale for import*.
2. **Add measures** — **Modeling → New measure**, paste each measure block from `02_measures.dax` (one per measure).
3. **Build visuals** — follow the *SUGGESTED VISUALS* section at the bottom of `02_measures.dax`.

## Notes
- The derived columns in step 1 are required by some measures (`Detractor %`, `Promoter %` use `RatingBucket`; the trend line uses `SessionMonth`).
- These scripts are independent of the Docker web dashboard — they're an alternate way to explore the same data in Power BI.
