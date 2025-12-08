const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync(
    "c:\\Users\\Admin\\Downloads\\expense-tracker.expenses.json",
    "utf8"
  )
);

console.log("Total expenses:", data.length);

// Count by source
const sources = {};
data.forEach((e) => {
  const key = e.source.toLowerCase().trim();
  sources[key] = (sources[key] || 0) + 1;
});

const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);

console.log("\nTop 50 expense sources:");
sorted.slice(0, 50).forEach(([source, count]) => {
  console.log(`${count}x - ${source}`);
});

// Sample of first 10 records
console.log("\n\nFirst 10 records:");
data.slice(0, 10).forEach((e, i) => {
  console.log(
    `${i + 1}. ${e.source} - ${e.note} - ${e.amount.toLocaleString()} VND - ${
      e.date.$date
    }`
  );
});
