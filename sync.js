const { createClient } = require("contentful");

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

const [OWNER, REPO] = process.env.GITHUB_REPOSITORY.split("/");
const FILE_PATH = "data/articles.json";
const BRANCH = "main";

async function getAllEntries() {
  let allItems = [];
  let skip = 0;
  const limit = 1000; // max allowed by Contentful

  while (true) {
    const res = await client.getEntries({
      skip,
      limit,
    });

    allItems = allItems.concat(res.items);

    if (skip + limit >= res.total) break;

    skip += limit;
  }

  return allItems;
}

async function run() {
  // 1. Fetch Contentful data
  const res = await client.getEntries();

  const data = await getAllEntries();

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  let sha = null;

  // 2. Check if file exists
  const fileRes = await fetch(
    `https://api.github.com/repos/panchalbhavya2210/chook/contents/data/articles.json`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ABC_GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (fileRes.ok) {
    const fileData = await fileRes.json();
    sha = fileData.sha;
  }

  // 3. Push file to GitHub
  const pushRes = await fetch(
    `https://api.github.com/repos/panchalbhavya2210/chook/contents/data/articles.json`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.ABC_GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "contentful-webhook",
      },
      body: JSON.stringify({
        message: "Auto sync from Contentful",
        content,
        branch: BRANCH,
        sha,
      }),
    },
  );

  if (!pushRes.ok) {
    const err = await pushRes.text();
    throw new Error(err);
  }

  console.log("Synced successfully");
}

run();
