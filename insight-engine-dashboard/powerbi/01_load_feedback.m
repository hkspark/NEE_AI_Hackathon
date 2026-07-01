// ============================================================================
// Power Query (M) — load & shape the training feedback CSV
// ----------------------------------------------------------------------------
// HOW TO USE:
//   Power BI Desktop > Home > Transform data (opens Power Query Editor) >
//   Home > New Source > Blank Query > Advanced Editor > paste this script.
//   Rename the query to:  Feedback
//   Then update the file path in the Source step if your CSV lives elsewhere.
// ============================================================================
let
    // --- adjust this path to your CSV location ---
    SourcePath = "C:\Users\jxh0jpg\Downloads\insight_engine_fake_training_feedback(in).csv",

    Source = Csv.Document(
        File.Contents(SourcePath),
        [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]
    ),
    Promoted = Table.PromoteHeaders(Source, [PromoteAllScalars = true]),

    Typed = Table.TransformColumnTypes(Promoted, {
        {"ResponseID", type text},
        {"TrainingName", type text},
        {"TrainingType", type text},
        {"LearningCategory", type text},
        {"SessionDate", type date},          // US m/d/yyyy parses with en-US locale
        {"AttendeeType", type text},
        {"BusinessUnit", type text},
        {"Role", type text},
        {"Rating", Int64.Type},
        {"FeedbackText", type text},
        {"Theme", type text},
        {"Sentiment", type text},
        {"SuggestedAction", type text},
        {"FollowUpRecommendation", type text}
    }),

    // Trim/clean text columns
    Cleaned = Table.TransformColumns(Typed, {
        {"FeedbackText", Text.Trim, type text},
        {"SuggestedAction", Text.Trim, type text},
        {"Theme", Text.Trim, type text}
    }),

    // Numeric sentiment score for averaging / weighting
    WithSentScore = Table.AddColumn(Cleaned, "SentimentScore", each
        if [Sentiment] = "Positive" then 1
        else if [Sentiment] = "Negative" then -1
        else 0, Int64.Type),

    // Helpful date parts for time-based visuals
    WithMonth = Table.AddColumn(WithSentScore, "SessionMonth", each Date.StartOfMonth([SessionDate]), type date),
    WithYearMonth = Table.AddColumn(WithMonth, "YearMonth", each Date.ToText([SessionDate], "yyyy-MM"), type text),

    // Detractor flag (rating 1-2), Promoter flag (rating 4-5) — simple CSAT buckets
    WithBuckets = Table.AddColumn(WithYearMonth, "RatingBucket", each
        if [Rating] <= 2 then "Detractor (1-2)"
        else if [Rating] = 3 then "Passive (3)"
        else "Promoter (4-5)", type text)
in
    WithBuckets
