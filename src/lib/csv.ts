/**
 * Parseur CSV léger, sans dépendance externe.
 * Gère les guillemets doubles, les champs contenant des virgules/points-virgules,
 * les retours à la ligne dans les champs, et détecte automatiquement le séparateur
 * (virgule ou point-virgule, courant dans les exports Excel FR).
 */

function detectDelimiter(sampleLine: string): string {
  const commaCount = (sampleLine.match(/,/g) || []).length;
  const semicolonCount = (sampleLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Normalise les retours à la ligne
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = normalized.split("\n")[0] ?? "";
  const delimiter = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  // Dernière ligne / champ si le fichier ne se termine pas par un saut de ligne
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.length > 0));
  const [headers, ...dataRows] = nonEmptyRows;

  return { headers: headers ?? [], rows: dataRows };
}
