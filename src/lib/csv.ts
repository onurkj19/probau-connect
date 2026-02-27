export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  const escapeCell = (value: string | number | boolean | null | undefined) => {
    const raw = value === null || value === undefined ? "" : String(value);
    const escaped = raw.replace(/"/g, "\"\"");
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
  };

  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
