export const nFormatter = (num: number, digits: number) => {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "t" },
        { value: 1e15, symbol: "q" },
        { value: 1e18, symbol: "Q" },
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup
        .slice()
        .reverse()
        .find(function (item) {
            return num >= item.value;
        });
    return item
        ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
        : "0";
};

export const numberWithCommas = (x: string) => {
    return x.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getBaseLog = (x: number, y: number) => {
    return Math.log(y) / Math.log(x);
};

export const getOverallTermInMonths = (
    termInYears: number,
    termInMonths: number
) => {
    let overallTermInMonths = termInMonths;
    if (termInYears > 0) {
        overallTermInMonths = overallTermInMonths + termInYears * 12;
    }
    return overallTermInMonths;
};

export const getLoanEndDate = (
    startDate: string,
    timeInYears: number,
    timeInMonths: number
) => {
    let overallTimeInMonths = getOverallTermInMonths(timeInYears, timeInMonths);
    // Parse ISO YYYY-MM-DD as local midnight. `new Date('2024-01-01')` parses as
    // UTC midnight, so in non-UTC timezones the local calendar day (and the month
    // callers read via getMonth/getFullYear) can land on the wrong day.
    let isoParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
    let date = isoParts
        ? new Date(Number(isoParts[1]), Number(isoParts[2]) - 1, Number(isoParts[3]))
        : new Date(startDate);
    date.setMonth(date.getMonth() + overallTimeInMonths);
    return date;
};

export const convertToWholeNumber = (value: string | number | undefined): number => {
    let numericValue = 0;

    if (typeof value === "string") {
        numericValue = isNaN(Number.parseFloat(value)) ? 0 : Number.parseFloat(value);
    } else if (typeof value === "undefined") {
        numericValue = 0;
    } else {
        numericValue = value;
    }

    return numericValue;
};
