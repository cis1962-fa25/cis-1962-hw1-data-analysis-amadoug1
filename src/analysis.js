/**
 * Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');

/**
 * Small helper: treat empty / "null" / missing as null value
 */
function isMissing(value) {
    if (value === null || value === undefined) return true;
    const str = String(value).trim();
    if (str === '') return true;
    if (str.toLowerCase() === 'null') return true;
    return false;
}

/**
 * Convert verified_purchase string to a real boolean
 */
function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (value === null || value === undefined) return false;
    const str = String(value).trim().toLowerCase();
    return str === 'true' || str === '1' || str === 'yes' || str === 'y';
}

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    // Read the whole CSV file as a string
    const csvString = fs.readFileSync(filename, 'utf8');

    // Use Papa.parse to turn it into an object
    const parsed = Papa.parse(csvString, {
        header: true, // first row is column names
        skipEmptyLines: true, // ignore blank lines
    });

    // parsed has shape { data: [...rows], meta: {...} }
    return parsed;
}

/**
 * [TODO] Step 2: Clean the Data
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object[]} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    // csv.data is the array of rows from papaparse
    const rows = csv.data;
    const cleaned = [];

    // columns that must NOT be null (user_gender is allowed to be null)
    const requiredColumns = [
        'review_id',
        'app_name',
        'app_category',
        'review_text',
        'review_language',
        'rating',
        'review_date',
        'verified_purchase',
        'device_type',
        'num_helpful_votes',
        'app_version',
        'user_id',
        'user_age',
        'user_country',
    ];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // skip any rows with missing required values
        let hasNull = false;
        for (let j = 0; j < requiredColumns.length; j++) {
            const col = requiredColumns[j];
            if (isMissing(row[col])) {
                hasNull = true;
                break;
            }
        }
        if (hasNull) {
            continue;
        }

        // build cleaned record
        const cleanedRecord = {
            review_id: parseInt(row.review_id, 10),
            app_name: row.app_name,
            app_category: row.app_category,
            review_text: row.review_text,
            review_language: row.review_language,
            rating: parseFloat(row.rating),
            review_date: new Date(row.review_date),
            verified_purchase: toBoolean(row.verified_purchase),
            device_type: row.device_type,
            num_helpful_votes: parseInt(row.num_helpful_votes, 10),
            app_version: row.app_version,
            user: {
                user_age: parseInt(row.user_age, 10),
                user_country: row.user_country,
                // user_gender can be empty; replace null-ish with empty string
                user_gender: isMissing(row.user_gender) ? '' : row.user_gender,
                user_id: parseInt(row.user_id, 10),
            },
        };

        cleaned.push(cleanedRecord);
    }

    return cleaned;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    // make sure rating is a number
    const r = typeof rating === 'number' ? rating : parseFloat(r);

    if (isNaN(r)) {
        return 'neutral';
    }

    if (r > 4) {
        return 'positive';
    } else if (r < 2) {
        return 'negative';
    } else {
        // between 2 and 4 (inclusive)
        return 'neutral';
    }
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 * @param {Object[]} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]}
 */
function sentimentAnalysisApp(cleaned) {
    const appStats = {}; // key: app_name, value: { app_name, positive, neutral, negative }

    for (let i = 0; i < cleaned.length; i++) {
        const review = cleaned[i];

        // add sentiment property to the review object
        const sentiment = labelSentiment(review);
        review.sentiment = sentiment;

        const appName = review.app_name;

        // if we haven't seen this app yet, initialize its counts
        if (!appStats[appName]) {
            appStats[appName] = {
                app_name: appName,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        // increase the right counter
        if (sentiment === 'positive') {
            appStats[appName].positive++;
        } else if (sentiment === 'negative') {
            appStats[appName].negative++;
        } else {
            appStats[appName].neutral++;
        }
    }

    // convert the appStats object into an array
    const result = [];
    for (const appName in appStats) {
        if (Object.prototype.hasOwnProperty.call(appStats, appName)) {
            result.push(appStats[appName]);
        }
    }

    return result;
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 * @param {Object[]} cleaned - the cleaned csv data
 * @returns {{lang_name: string, positive: number, neutral: number, negative: number}[]}
 */
function sentimentAnalysisLang(cleaned) {
    const langStats = {}; // key: language code, value: { lang_name, positive, neutral, negative }

    for (let i = 0; i < cleaned.length; i++) {
        const review = cleaned[i];

        // add sentiment property (again is fine; same result)
        const sentiment = labelSentiment(review);
        review.sentiment = sentiment;

        const lang = review.review_language;

        if (!langStats[lang]) {
            langStats[lang] = {
                lang_name: lang,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        if (sentiment === 'positive') {
            langStats[lang].positive++;
        } else if (sentiment === 'negative') {
            langStats[lang].negative++;
        } else {
            langStats[lang].neutral++;
        }
    }

    const result = [];
    for (const lang in langStats) {
        if (Object.prototype.hasOwnProperty.call(langStats, lang)) {
            result.push(langStats[lang]);
        }
    }

    return result;
}

/**
 * [TODO] Step 4: Statistical Analysis
 * @param {Object[]} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: number}}
 */
function summaryStatistics(cleaned) {
    // handle empty case just in case
    if (!cleaned || cleaned.length === 0) {
        return {
            mostReviewedApp: null,
            mostReviews: 0,
            mostUsedDevice: null,
            mostDevices: 0,
            avgRating: 0,
        };
    }

    // 1) Count how many reviews each app has
    const appCounts = {}; // key: app_name, value: count

    for (let i = 0; i < cleaned.length; i++) {
        const appName = cleaned[i].app_name;
        if (!appCounts[appName]) {
            appCounts[appName] = 0;
        }
        appCounts[appName]++;
    }

    // 2) Find the app with the most reviews
    let mostReviewedApp = null;
    let mostReviews = 0;

    for (const appName in appCounts) {
        if (Object.prototype.hasOwnProperty.call(appCounts, appName)) {
            const count = appCounts[appName];
            if (count > mostReviews) {
                mostReviews = count;
                mostReviewedApp = appName;
            }
        }
    }

    // 3) Look only at reviews for that app
    const reviewsForMost = [];
    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i].app_name === mostReviewedApp) {
            reviewsForMost.push(cleaned[i]);
        }
    }

    // 4) Find most used device and average rating for that app
    const deviceCounts = {}; // key: device_type, value: count
    let ratingSum = 0;

    for (let i = 0; i < reviewsForMost.length; i++) {
        const review = reviewsForMost[i];

        // count devices
        const device = review.device_type;
        if (!deviceCounts[device]) {
            deviceCounts[device] = 0;
        }
        deviceCounts[device]++;

        // add to rating sum
        ratingSum += review.rating;
    }

    let mostUsedDevice = null;
    let mostDevices = 0;

    for (const device in deviceCounts) {
        if (Object.prototype.hasOwnProperty.call(deviceCounts, device)) {
            const count = deviceCounts[device];
            if (count > mostDevices) {
                mostDevices = count;
                mostUsedDevice = device;
            }
        }
    }

    const avgRating =
        reviewsForMost.length === 0 ? 0 : ratingSum / reviewsForMost.length;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
