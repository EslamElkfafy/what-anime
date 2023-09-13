import express from "express"
import fileUpload from "express-fileupload";
import fetch from "node-fetch";
import axios from "axios";
import https from "https";
import fs from "fs";
import fs1 from "fs/promises";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

function download(url) {
    https.get(url, (res) => {
        const path = "downloaded.mp4";
        const writeStream = fs.createWriteStream(path);
     
        res.pipe(writeStream);
     
        writeStream.on("finish", () => {
           writeStream.close();
           console.log("Download Completed!");
        })
     })
}

async function deleteAllFilesInDir(req, res, next) {
    var dirPath="./upload/";
    try {
      const files = await fs1.readdir(dirPath);
  
      const deleteFilePromises = files.map(file =>
        fs1.unlink(path.join(dirPath, file)),
      );
  
      await Promise.all(deleteFilePromises);
    } catch (err) {
      console.log(err);
    }
    next();
}

app.use(deleteAllFilesInDir);
app.use(
    fileUpload({
        limits: {
            fileSize: 10000000,
        },
        abortOnLimit: true,
    })
);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render("index.ejs");
});

app.post('/upload', async(req, res) => {
    var imageFile = req.files.image;

    var idAnime = [];
    var episodeAnime = [];
    var videoAnime = [];
    var nameAnime = [];
    var imageAnime = [];

    if (!imageFile) return res.sendStatus(400);
    
    await imageFile.mv(__dirname + '/upload/' + imageFile.name);

    var response = await fetch("https://api.trace.moe/search", {
        method: "POST",
        body: fs.readFileSync("upload/" + imageFile.name),
        headers: { "Content-type": imageFile.mimetype },
    });

    var data = await response.json();


    for (let i = 0; i < 3; i++) {
        idAnime.push(data["result"][i]["anilist"]);
        episodeAnime.push(data["result"][i]["episode"]);
        videoAnime.push(data["result"][i]["video"]);
    }
    
    for (let i = 0; i < 3; i++) {
        response = await fetch(
            `https://api.trace.moe/search?anilistID=${idAnime[i]}&anilistInfo&url=${encodeURIComponent(
            "https://images.plurk.com/32B15UXxymfSMwKGTObY5e.jpg"
            )}`
        );
    
        data = await response.json();

        nameAnime.push(data["result"][0]["anilist"]["title"]["romaji"]);
    }

    
    for (let i = 0; i < 3; i++) {
        response = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${nameAnime[i]}`);

        data = await response.data;

        imageAnime.push(data["data"][0]["attributes"]["posterImage"]["original"]);
    }
    

    var results = {
      episode: episodeAnime,
      video: videoAnime,
      name:nameAnime,
      image: imageAnime
    };

    // console.log(results);

    res.render("result.ejs", {data: results});
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});