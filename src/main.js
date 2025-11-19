
const {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
} = require('./analysis');

function main() {
    // Step 1: Call parseData with the CSV file path
    const filename = './src/multilingual_mobile_app_reviews_2025.csv';
    const parsed = parseData(filename);

    // Step 2: Clean the data
    const cleaned = cleanData(parsed);

    // Step 3: Sentiment analysis
    const appSentiments = sentimentAnalysisApp(cleaned);
    const langSentiments = sentimentAnalysisLang(cleaned);

    // Step 4: Statistical analysis
    const summary = summaryStatistics(cleaned);

    // Print some info so we can see results when we run "node src/main.js"
    console.log('Number of cleaned reviews:', cleaned.length);
    console.log('Sentiment by app:', appSentiments);
    console.log('Sentiment by language:', langSentiments);
    console.log('Summary statistics:', summary);
}

// Actually call the function so ESLint knows these are used
main();
