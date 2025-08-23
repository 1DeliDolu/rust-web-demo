const fetch = require("node-fetch");
(async () => {
  try {
    const r1 = await fetch("http://localhost:3001/api/categories");
    console.log("categories status", r1.status);
    console.log(await r1.text());
  } catch (e) {
    console.error("categories fetch error", e.message);
  }
  try {
    const r2 = await fetch("http://localhost:3001/api/products");
    console.log("products status", r2.status);
    console.log(await r2.text());
  } catch (e) {
    console.error("products fetch error", e.message);
  }
})();
