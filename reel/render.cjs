const pp=require("puppeteer");const {spawn}=require("child_process");
const FF=process.argv[2]||require("ffmpeg-static"),FPS=30;
(async()=>{const b=await pp.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:"new",args:["--allow-file-access-from-files"]});const p=await b.newPage();await p.setViewport({width:1080,height:1920});
await p.goto("file://"+require("path").resolve(__dirname,"reel.html").replace(/\\/g,"/"),{waitUntil:"networkidle0"});await p.evaluate(()=>window.ready);
const N=Math.round(26*FPS);
const ff=spawn(FF,["-y","-f","image2pipe","-framerate",String(FPS),"-c:v","mjpeg","-i","-","-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-movflags","+faststart",require("path").join(__dirname,"sssoft-reel-nomusic.mp4")],{stdio:["pipe","ignore","inherit"]});
for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/FPS);const buf=await p.screenshot({type:"jpeg",quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once("drain",r));if(i%150===0)console.log("frame",i);}
ff.stdin.end();await new Promise(r=>ff.on("close",r));await b.close();console.log("done");})();
