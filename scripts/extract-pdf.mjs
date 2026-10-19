import fs from "node:fs";
import { PDFParse } from "pdf-parse";

const path =
  "C:/Users/LENOVO/.cursor/projects/c-Users-LENOVO-braims-inspired-learning-hub/attachments/c236c9eb-2bf7-4091-b350-bc254264c9b1/LRBN_SENGKALING-64_compressed.pdf";
const buf = new Uint8Array(fs.readFileSync(path));
const parser = new PDFParse(buf);
const result = await parser.getText();
const text = typeof result === "string" ? result : result?.text ?? JSON.stringify(result);
fs.writeFileSync("pdf-extract.txt", text);
console.log(text.slice(0, 12000));
