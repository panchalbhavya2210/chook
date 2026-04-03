import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.PRJID,
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

const OWNER = "panchalbhavya2210";
const REPO = "chook";
const FILE_PATH = "data/articles2.json";
const BRANCH = "master";

async function getAllEntries() {
  const query = `*[]{
    ...,
    _type,
    _id,
    _createdAt,
    _updatedAt
  }`;
  return await client.fetch(query);
}

async function run() {
  try {
    // 1. Fetch Sanity data
    const data = await getAllEntries();

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString(
      "base64",
    );

    let sha = null;

    // 2. Check if file exists
    const fileRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
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
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.ABC_GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Auto sync from Sanity",
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
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

run();
