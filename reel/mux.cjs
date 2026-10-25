// Adds the STARFARER main theme (Terminal Velocity) to the rendered reel and
// builds the web version used on the site.
// The song lives in the space-racing repo: public/starRacer/music/Terminal Velocity.mp3
// Copy it next to this file as tv.mp3 (git-ignored) before running.
// 15.8s offset: the song's drop at 18s lands exactly on the 2.2s scene change.
const { execFileSync } = require("child_process");
const path = require("path");
const FF = process.argv[2] || require("ffmpeg-static");
const here = (f) => path.join(__dirname, f);
const run = (args) => execFileSync(FF, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

run(["-i", here("sssoft-reel-nomusic.mp4"), "-ss", "15.8", "-t", "32", "-i", here("tv.mp3"),
  "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-af", "afade=t=in:st=0:d=0.3,afade=t=out:st=30.3:d=1.7,loudnorm=I=-14:TP=-1.5:LRA=11",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", here("sssoft-reel.mp4")]);
run(["-i", here("sssoft-reel.mp4"), "-vf", "scale=720:1280", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
  "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", here("../public/sssoft-reel-720.mp4")]);
run(["-ss", "1.6", "-i", here("sssoft-reel.mp4"), "-frames:v", "1", "-vf", "scale=720:1280", "-q:v", "4",
  here("../public/sssoft-reel-poster.jpg")]);
console.log("done");
