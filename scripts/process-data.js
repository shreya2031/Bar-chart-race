const fs = require("fs");
const path = require("path");
const d3 = require("d3");

const dataPath = path.join(__dirname, "raw-data.json");
const outFile = path.join(__dirname, "data.json");

const monthsPerBucket = 12;
const dateFormat = "%Y-%m-%d";

const init = async () => {
  try {
    const res = await readFile(dataPath);
    const data = JSON.parse(res).map((d) => ({
      name: d.tagName,
      values: d.values.map((d) => ({
        ...d,
        value: d.percent,
        date: d3.timeFormat(dateFormat)(new Date(d.yearMonth)),
      })),
    }));

    const uniqueYears = [...new Set(data[0].values.map(({ date }) => date.substring(0, 4)))];

    let processedKeyframes = [];

    uniqueYears.forEach((year) => {
      const timestamp = `01-01-${year}`;
      const values = data
        .map(({ name, values }) => {
          const bucketValues = values.filter(({ date }) => date.startsWith(year));
          if (!bucketValues.length) return null;

          const averageValue = d3.mean(bucketValues, (d) => d.value);
          return { name, value: averageValue };
        })
        .filter((d) => d);

      const rankedValues = getRanks(values);
      processedKeyframes.push([timestamp, rankedValues]);
    });

    fs.writeFileSync(outFile, JSON.stringify(processedKeyframes));
  } catch (e) {
    console.log("Error:", e);
  }
};

init();

function readFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, "utf8", function (error, data) {
      if (error) return reject(error);
      resolve(data);
    });
  });
}

function getRanks(arr) {
  return arr
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({
      ...d,
      rank: i,
    }));
}