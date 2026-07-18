import fs from "fs";
import path from "path";
import https from "https";

const CARS_DIR = path.join(process.cwd(), "public", "cars");

if (!fs.existsSync(CARS_DIR)) {
  fs.mkdirSync(CARS_DIR, { recursive: true });
}

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, (redirectRes) => {
          const fileStream = fs.createWriteStream(filepath);
          redirectRes.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });
        }).on("error", reject);
      } else {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      }
    }).on("error", reject);
  });
};

async function main() {
  console.log("Downloading 15 high quality car images to public/cars/...");
  for (let i = 1; i <= 15; i++) {
    const url = `https://picsum.photos/seed/coolcar${i}/800/600`;
    const filepath = path.join(CARS_DIR, `${i}.jpg`);
    console.log(`Downloading car ${i}...`);
    try {
      await downloadImage(url, filepath);
      console.log(`Saved ${filepath}`);
    } catch (e) {
      console.error(`Failed ${i}`, e);
    }
  }
  console.log("Done!");
}

main();
