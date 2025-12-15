import fs from "node:fs";
import { dumbifySvg } from "./dumbifySvg.js";

const input = fs.readFileSync("input.svg", "utf8");
const output = dumbifySvg(input, { replacePaintServers: true, defaultPaint: "#223656" });
fs.writeFileSync("output.svg", output, "utf8");
