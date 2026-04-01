import { createClient } from "contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

const [OWNER, REPO] = process.env.GITHUB_REPOSITORY.split("/");
const FILE_PATH = "data/articles.json";
const BRANCH = "main";

async function run() {
  // 1. Fetch Contentful data
  const res = await client.getEntries({
    content_type: "article",
  });

  const data = res.items;

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  let sha = null;

  // 2. Check if file exists
  const fileRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
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
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
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
