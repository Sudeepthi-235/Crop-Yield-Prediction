// PDF soil data extractor using pdfjs-dist
export async function extractSoilFromPDF(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const workerUrl = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url,
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return parseSoilText(fullText);
  } catch (err) {
    console.error("PDF extraction failed:", err);
    return null;
  }
}

function parseSoilText(text) {
  const lower = text.toLowerCase();

  const extract = (patterns, defaultVal = "") => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1]?.trim() || defaultVal;
    }
    return defaultVal;
  };

  const soilTypes = [
    "loamy",
    "sandy",
    "clay",
    "silt",
    "peaty",
    "chalky",
    "loam",
    "sandy loam",
    "clay loam",
  ];
  let soilType = "";
  for (const t of soilTypes) {
    if (lower.includes(t)) {
      soilType = t;
      break;
    }
  }

  const ph = extract([
    /ph[\s:]*([0-9]+\.?[0-9]*)/i,
    /soil\s+ph[\s:]*([0-9]+\.?[0-9]*)/i,
    /ph\s+value[\s:]*([0-9]+\.?[0-9]*)/i,
  ]);

  const nitrogen = extract([
    /nitrogen[\s:]*([0-9]+\.?[0-9]*)/i,
    /\bN[\s:]*([0-9]+\.?[0-9]*)\s*(kg|%|ppm)/i,
    /available\s+nitrogen[\s:]*([0-9]+\.?[0-9]*)/i,
  ]);

  const phosphorus = extract([
    /phosphorus[\s:]*([0-9]+\.?[0-9]*)/i,
    /phosphate[\s:]*([0-9]+\.?[0-9]*)/i,
    /\bP[\s:]*([0-9]+\.?[0-9]*)\s*(kg|%|ppm)/i,
  ]);

  const potassium = extract([
    /potassium[\s:]*([0-9]+\.?[0-9]*)/i,
    /\bK[\s:]*([0-9]+\.?[0-9]*)\s*(kg|%|ppm)/i,
    /available\s+potassium[\s:]*([0-9]+\.?[0-9]*)/i,
  ]);

  const organicCarbon = extract([
    /organic\s+carbon[\s:]*([0-9]+\.?[0-9]*)/i,
    /organic\s+matter[\s:]*([0-9]+\.?[0-9]*)/i,
    /\bOC[\s:]*([0-9]+\.?[0-9]*)/i,
  ]);

  return {
    type: soilType,
    ph: ph ? parseFloat(ph) : "",
    nitrogen: nitrogen ? parseFloat(nitrogen) : "",
    phosphorus: phosphorus ? parseFloat(phosphorus) : "",
    potassium: potassium ? parseFloat(potassium) : "",
    organic_carbon: organicCarbon ? parseFloat(organicCarbon) : "",
  };
}
