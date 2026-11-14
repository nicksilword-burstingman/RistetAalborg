import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import path from "node:path";
import { existsSync } from "node:fs";

const [harvest, processing] = process.argv.slice(2);
if (
  !harvest ||
  !processing ||
  !existsSync(harvest) ||
  !existsSync(processing)
) {
  throw new Error(
    "Angiv lokale originalfiler til høstfilmen og forarbejdningsfilmen. Se docs/MEDIA.md.",
  );
}
const shots = [
  { file: harvest, start: 73 },
  { file: harvest, start: 57 },
  { file: processing, start: 197 },
  { file: harvest, start: 288 },
  { file: harvest, start: 385 },
];
const filter = shots.map(
  (_, index) =>
    `[${index}:v]trim=duration=2.3,setpts=PTS-STARTPTS,fps=24,crop=320:180:0:0,scale=960:540:flags=lanczos,setsar=1,settb=AVTB,format=yuv420p,eq=saturation=0.92:contrast=1.03[v${index}]`,
);
let previous = "v0";
for (let i = 1; i < shots.length; i++) {
  const next = `fade${i}`;
  filter.push(
    `[${previous}][v${i}]xfade=transition=fade:duration=0.4:offset=${(1.9 * i).toFixed(1)}[${next}]`,
  );
  previous = next;
}
const output = path.resolve("public/video/coffee-origins.mp4");
const inputs = shots.flatMap((shot) => [
  "-ss",
  String(shot.start),
  "-t",
  "2.3",
  "-i",
  path.resolve(shot.file),
]);
function run(args) {
  const result = spawnSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "error", "-y", ...args],
    { stdio: "inherit" },
  );
  if (result.status !== 0)
    throw new Error("Kaffefilmen kunne ikke eksporteres.");
}
run([
  ...inputs,
  "-filter_complex",
  filter.join(";"),
  "-map",
  `[${previous}]`,
  "-an",
  "-t",
  "9.9",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-profile:v",
  "high",
  "-preset",
  "slow",
  "-crf",
  "22",
  "-movflags",
  "+faststart",
  "-map_metadata",
  "-1",
  output,
]);
run([
  "-ss",
  "1",
  "-i",
  output,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  path.resolve("public/video/coffee-origins-poster.jpg"),
]);
console.log("Kaffefilm og plakat eksporteret: højst 10 sekunder, uden lyd.");
