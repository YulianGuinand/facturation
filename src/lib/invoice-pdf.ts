import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import { applyPdfACompliance, sanitizeTextForPdf } from "./pdf-a-compliance";

interface InvoiceData {
  number: string;
  documentType: string;
  issueDate: number;
  dueDate: number;
  deliveryDate?: number;
  currency?: string;
  customerNotes?: string;
  legalNotes?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  orderReference?: string;
  contractReference?: string;
  latePenaltyRate?: number;
  flatRateIndemnity?: number;
  amountPaid?: number;
  amountDue?: number;
  operationNature?: string;
  taxOption?: string;
  rcs?: string;
  shareCapital?: number;
  discountRate?: string;
  bankAccount?: { iban: string; bic: string; bankName?: string };
  logoBase64?: string;
  facturXxml: Uint8Array;

  company: {
    name: string;
    legalForm?: string;
    siren?: string;
    siret?: string;
    vatNumber?: string;
    address?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
  };

  customer: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    siren?: string;
    siret?: string;
    vatNumber?: string;
    address?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };

  deliveryAddress?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };

  vatBreakdown?: Array<{
    rate: number;
    base: number;
    amount: number;
  }>;

  items: Array<{
    reference?: string;
    designation: string;
    quantity: number;
    unit?: string;
    unitPriceExclTax: number;
    discountPercent?: number;
    vatRate: number;
    totalExclTax: number;
    vatAmount: number;
    totalInclTax: number;
  }>;

  totals: {
    totalExclTax: number;
    totalVat: number;
    totalInclTax: number;
  };
}

const MARGIN = 50;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const BLUE: [number, number, number] = [0.05, 0.25, 0.55];
const GRAY: [number, number, number] = [0.96, 0.96, 0.96];

async function loadFonts(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  const ttfDir = path.join(process.cwd(), "src/lib/fonts");
  const woffDir = path.join(
    process.cwd(),
    "node_modules/@fontsource/roboto/files",
  );

  const loadOpts = { subset: true };

  const tryLoad = async (
    ttfName: string,
    woffName: string,
  ): Promise<PDFFont> => {
    const ttfPath = path.join(ttfDir, ttfName);
    if (fs.existsSync(ttfPath)) {
      return pdfDoc.embedFont(fs.readFileSync(ttfPath), loadOpts);
    }
    const woffPath = path.join(woffDir, woffName);
    return pdfDoc.embedFont(fs.readFileSync(woffPath), loadOpts);
  };

  const regular = await tryLoad("Roboto-Regular.ttf", "roboto-latin-400-normal.woff");
  const bold = await tryLoad("Roboto-Bold.ttf", "roboto-latin-700-normal.woff");
  const italic = await tryLoad("Roboto-Italic.ttf", "roboto-latin-400-italic.woff");
  return { regular, bold, italic };
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size = 10,
  color: number[] = [0.2, 0.2, 0.2],
) {
  page.drawText(sanitizeTextForPdf(text), {
    x,
    y,
    size,
    font,
    color: rgb(color[0], color[1], color[2]),
  });
}

function drawTextRight(
  page: PDFPage,
  font: PDFFont,
  text: string,
  rightX: number,
  y: number,
  size = 10,
  color: number[] = [0.2, 0.2, 0.2],
) {
  const textWidth = font.widthOfTextAtSize(sanitizeTextForPdf(text), size);
  page.drawText(sanitizeTextForPdf(text), {
    x: rightX - textWidth,
    y,
    size,
    font,
    color: rgb(color[0], color[1], color[2]),
  });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR");
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export async function generateInvoicePdf(
  data: InvoiceData,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const { regular, bold, italic } = fonts;

  // Embed logo if present
  let logoImage: any;
  let logoDims: { width: number; height: number } | undefined;
  if (data.logoBase64) {
    const b64 = data.logoBase64.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    if (data.logoBase64.startsWith("data:image/png")) {
      logoImage = await pdfDoc.embedPng(bytes);
    } else {
      logoImage = await pdfDoc.embedJpg(bytes);
    }
    const aspect = logoImage.width / logoImage.height;
    const maxW = 140;
    const maxH = 50;
    logoDims =
      aspect > maxW / maxH
        ? { width: maxW, height: maxW / aspect }
        : { width: maxH * aspect, height: maxH };
  }

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ── Header: logo (left) + company name + date/number (right) ──
  const headerTopY = PAGE_H - MARGIN;

  // Define a bounding box height for the left section to perfectly center logo and text
  let leftBlockHeight = 50;
  if (logoImage && logoDims) {
    leftBlockHeight = Math.max(logoDims.height, 22);
  }

  // Calculate vertically centered Y position for the 22pt text (~16pt cap height -> offset by 8)
  const textY = headerTopY - leftBlockHeight / 2 - 8;
  let headerX = MARGIN;

  if (logoImage && logoDims) {
    const logoY = headerTopY - leftBlockHeight / 2 - logoDims.height / 2;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });
    headerX = MARGIN + logoDims.width + 20; // Clean 20px spacing
  }

  drawText(page, bold, data.company.name, headerX, textY, 22, [0.1, 0.1, 0.1]);

  // Right side (Professionally right-aligned using drawTextRight)
  const rx = PAGE_W - MARGIN;
  const labelMap: Record<string, string> = {
    invoice: "FACTURE",
    quote: "DEVIS",
    credit_note: "AVOIR",
    purchase_order: "BON DE COMMANDE",
    deposit_invoice: "FACTURE D'ACOMPTE",
    progress_invoice: "FACTURE DE SITUATION",
  };
  const typeLabel = labelMap[data.documentType] ?? "DOCUMENT";

  drawTextRight(page, bold, typeLabel, rx, headerTopY - 16, 16, BLUE);
  drawTextRight(page, regular, `N° ${data.number}`, rx, headerTopY - 34, 10);

  const dateY = headerTopY - 54;
  const labelX = rx - 120;
  drawText(page, regular, "Date", labelX, dateY, 9, [0.5, 0.5, 0.5]);
  drawTextRight(page, bold, formatDate(data.issueDate), rx, dateY, 9, BLUE);

  drawText(page, regular, "Échéance", labelX, dateY - 14, 9, [0.5, 0.5, 0.5]);
  drawTextRight(page, bold, formatDate(data.dueDate), rx, dateY - 14, 9, BLUE);

  if (data.deliveryDate) {
    drawText(
      page,
      regular,
      "Livraison",
      labelX,
      dateY - 28,
      9,
      [0.5, 0.5, 0.5],
    );
    drawTextRight(
      page,
      bold,
      formatDate(data.deliveryDate),
      rx,
      dateY - 28,
      9,
      BLUE,
    );
  }

  // ── Gray section: Supplier + Customer side by side ──
  y = headerTopY - 100; // Ensure proper margin below the newly formatted header
  const grayH = 145;
  page.drawRectangle({
    x: MARGIN,
    y: y - grayH,
    width: PAGE_W - 2 * MARGIN,
    height: grayH,
    color: rgb(GRAY[0], GRAY[1], GRAY[2]),
  });

  const PADDING = 15;

  // Supplier (left)
  const colMid = PAGE_W / 2;
  const secY = y - PADDING;
  drawText(
    page,
    bold,
    "Fournisseur",
    MARGIN + PADDING,
    secY,
    9,
    [0.3, 0.3, 0.3],
  );
  drawText(page, bold, data.company.name, MARGIN + PADDING, secY - 16, 10);
  let sy = secY - 30;

  const legalParts: string[] = [];
  if (data.company.legalForm) legalParts.push(data.company.legalForm);
  if (data.shareCapital)
    legalParts.push(`Capital : ${formatMoney(data.shareCapital)}`);
  if (legalParts.length > 0) {
    drawText(page, regular, legalParts.join(" · "), MARGIN + PADDING, sy, 8);
    sy -= 12;
  }
  if (data.rcs) {
    drawText(page, regular, `RCS ${data.rcs}`, MARGIN + PADDING, sy, 8);
    sy -= 12;
  }
  if (data.company.siren) {
    drawText(
      page,
      regular,
      `SIREN ${data.company.siren}`,
      MARGIN + PADDING,
      sy,
      8,
    );
    sy -= 12;
  }
  if (data.company.vatNumber) {
    drawText(
      page,
      regular,
      `TVA : ${data.company.vatNumber}`,
      MARGIN + PADDING,
      sy,
      8,
    );
    sy -= 12;
  }
  if (data.company.address) {
    drawText(page, regular, data.company.address, MARGIN + PADDING, sy, 8);
    sy -= 12;
  }
  const compCity = [data.company.postalCode, data.company.city]
    .filter(Boolean)
    .join(" ");
  if (compCity) {
    drawText(page, regular, compCity, MARGIN + PADDING, sy, 8);
    sy -= 12;
  }
  if (data.company.country) {
    drawText(page, regular, data.company.country, MARGIN + PADDING, sy, 8);
  }

  // Customer (right)
  const cx = colMid + 10;
  drawText(page, bold, "Client", cx, secY, 9, [0.3, 0.3, 0.3]);
  const custName =
    data.customer.companyName ??
    `${data.customer.firstName ?? ""} ${data.customer.lastName ?? ""}`.trim();
  drawText(page, bold, custName || "Client", cx, secY - 16, 10);
  let cy = secY - 30;
  if (data.customer.siren) {
    drawText(page, regular, `SIREN ${data.customer.siren}`, cx, cy, 8);
    cy -= 12;
  }
  if (data.customer.vatNumber) {
    drawText(page, regular, `TVA : ${data.customer.vatNumber}`, cx, cy, 8);
    cy -= 12;
  }
  if (data.customer.address) {
    drawText(page, regular, data.customer.address, cx, cy, 8);
    cy -= 12;
  }
  const custCity = [data.customer.postalCode, data.customer.city]
    .filter(Boolean)
    .join(" ");
  if (custCity) {
    drawText(page, regular, custCity, cx, cy, 8);
    cy -= 12;
  }
  if (data.customer.country) {
    drawText(page, regular, data.customer.country, cx, cy, 8);
  }

  if (data.deliveryAddress) {
    cy -= 18;
    drawText(page, bold, "Adresse de livraison", cx, cy, 8, [0.3, 0.3, 0.3]);
    cy -= 12;
    if (data.deliveryAddress.line1) {
      drawText(page, regular, data.deliveryAddress.line1, cx, cy, 7);
      cy -= 11;
    }
    if (data.deliveryAddress.line2) {
      drawText(page, regular, data.deliveryAddress.line2, cx, cy, 7);
      cy -= 11;
    }
    const delCity = [data.deliveryAddress.postalCode, data.deliveryAddress.city]
      .filter(Boolean)
      .join(" ");
    if (delCity) {
      drawText(page, regular, delCity, cx, cy, 7);
      cy -= 11;
    }
    if (data.deliveryAddress.country) {
      drawText(page, regular, data.deliveryAddress.country, cx, cy, 7);
    }
  }

  // ── Items table ──
  y = y - grayH - 20;

  const colLeftX = {
    line: MARGIN + 5,
    designation: MARGIN + 25,
  };
  const colRightX = {
    price: PAGE_W - MARGIN - 180,
    qty: PAGE_W - MARGIN - 140,
    vat: PAGE_W - MARGIN - 90,
    totalHT: PAGE_W - MARGIN - 50,
    totalTTC: PAGE_W - MARGIN - 5,
  };

  drawText(page, bold, "#", colLeftX.line, y, 8, BLUE);
  drawText(page, bold, "Désignation", colLeftX.designation, y, 8, BLUE);
  drawTextRight(page, bold, "PU HT", colRightX.price, y, 8, BLUE);
  drawTextRight(page, bold, "Qté", colRightX.qty, y, 8, BLUE);
  drawTextRight(page, bold, "TVA", colRightX.vat, y, 8, BLUE);
  drawTextRight(page, bold, "Total HT", colRightX.totalHT, y, 8, BLUE);
  drawTextRight(page, bold, "Total TTC", colRightX.totalTTC, y, 8, BLUE);

  page.drawLine({
    start: { x: MARGIN, y: y - 6 },
    end: { x: PAGE_W - MARGIN, y: y - 6 },
    thickness: 2,
    color: rgb(BLUE[0], BLUE[1], BLUE[2]),
  });
  y -= 22;

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (y < 80) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }

    drawText(page, regular, `${i + 1}.`, colLeftX.line, y, 8);
    drawText(page, regular, item.designation, colLeftX.designation, y, 8);
    drawTextRight(
      page,
      regular,
      formatMoney(item.unitPriceExclTax),
      colRightX.price,
      y,
      8,
    );
    drawTextRight(page, regular, item.quantity.toString(), colRightX.qty, y, 8);
    drawTextRight(
      page,
      regular,
      `${(item.vatRate / 100).toFixed(1)}%`,
      colRightX.vat,
      y,
      8,
    );
    drawTextRight(
      page,
      regular,
      formatMoney(item.totalExclTax),
      colRightX.totalHT,
      y,
      8,
    );
    drawTextRight(
      page,
      regular,
      formatMoney(item.totalInclTax),
      colRightX.totalTTC,
      y,
      8,
    );

    page.drawLine({
      start: { x: MARGIN, y: y - 8 },
      end: { x: PAGE_W - MARGIN, y: y - 8 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= 22;
  }

  // ── Totals ──
  y -= 10;
  if (y < 130) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  const totW = 200;
  const totX = PAGE_W - MARGIN - totW;
  const labX = totX + 15;
  const valX = colRightX.totalTTC;

  drawText(page, regular, "Total HT", labX, y, 10, [0.5, 0.5, 0.5]);
  drawTextRight(
    page,
    bold,
    formatMoney(data.totals.totalExclTax),
    valX,
    y,
    10,
    BLUE,
  );
  y -= 20;

  drawText(page, regular, "Total TVA", labX, y, 10, [0.5, 0.5, 0.5]);
  drawTextRight(
    page,
    bold,
    formatMoney(data.totals.totalVat),
    valX,
    y,
    10,
    BLUE,
  );
  y -= 26;

  page.drawRectangle({
    x: totX,
    y: y - 8,
    width: totW,
    height: 28,
    color: rgb(BLUE[0], BLUE[1], BLUE[2]),
  });
  drawText(page, bold, "Total TTC", labX, y + 1, 12, [1, 1, 1]);
  drawTextRight(
    page,
    bold,
    formatMoney(data.totals.totalInclTax),
    valX,
    y + 1,
    12,
    [1, 1, 1],
  );

  if (data.amountPaid !== undefined && data.amountPaid > 0) {
    y -= 36;
    drawText(page, regular, "Déjà payé", labX, y, 10, [0.5, 0.5, 0.5]);
    drawTextRight(
      page,
      bold,
      formatMoney(data.amountPaid),
      valX,
      y,
      10,
      [0.8, 0.1, 0.1],
    );
    y -= 20;
    drawText(page, bold, "Reste à payer", labX, y, 10, [0.8, 0.1, 0.1]);
    drawTextRight(
      page,
      bold,
      formatMoney(data.amountDue ?? 0),
      valX,
      y,
      10,
      [0.8, 0.1, 0.1],
    );
  }

  // ── Operation nature & tax option ──
  y -= 50;
  const infoLines: string[] = [];
  if (data.operationNature)
    infoLines.push(`Nature de l'opération : ${data.operationNature}`);
  if (data.taxOption) infoLines.push(data.taxOption);
  if (infoLines.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    for (const ln of infoLines) {
      drawText(page, regular, ln, MARGIN, y, 9, [0.3, 0.3, 0.3]);
      y -= 14;
    }
  }

  // ── Payment details ──
  y -= 25;
  if (y < 120) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  drawText(page, bold, "COORDONNÉES BANCAIRES", MARGIN, y, 10, BLUE);
  y -= 16;
  if (data.bankAccount) {
    if (data.bankAccount.bankName) {
      drawText(page, regular, data.bankAccount.bankName, MARGIN, y, 9);
      y -= 14;
    }
    drawText(page, regular, `IBAN : ${data.bankAccount.iban}`, MARGIN, y, 9);
    y -= 14;
    drawText(page, regular, `BIC : ${data.bankAccount.bic}`, MARGIN, y, 9);
    y -= 14;
  }
  drawText(page, regular, `Réf. paiement : ${data.number}`, MARGIN, y, 9);

  // ── Legal mentions ──
  y -= 30;
  if (y < 120) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  drawText(
    page,
    bold,
    "CONDITIONS DE PAIEMENT ET MENTIONS LÉGALES",
    MARGIN,
    y,
    9,
    BLUE,
  );
  y -= 16;

  if (data.latePenaltyRate) {
    drawText(
      page,
      regular,
      `Pénalités de retard : ${(data.latePenaltyRate / 100).toFixed(2)}% du montant total TTC`,
      MARGIN,
      y,
      8,
    );
    y -= 12;
  }
  drawText(
    page,
    regular,
    "Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 € (art. L.441-10 C.com.)",
    MARGIN,
    y,
    8,
  );
  y -= 12;

  drawText(
    page,
    regular,
    `Escompte pour paiement anticipé : ${data.discountRate ?? "néant"}`,
    MARGIN,
    y,
    8,
  );
  y -= 12;

  if (data.paymentTerms) {
    drawText(
      page,
      regular,
      `Conditions de règlement : ${data.paymentTerms}`,
      MARGIN,
      y,
      8,
    );
    y -= 12;
  }

  if (data.legalNotes) {
    drawText(page, italic, data.legalNotes, MARGIN, y, 7, [0.5, 0.5, 0.5]);
    y -= 15;
  }

  // ── Section Signature & Bon pour accord ──
  y -= 20;
  const sigBoxHeight = 90;
  const sigBoxWidth = 220;

  if (y - sigBoxHeight < 60) {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  const sigX = PAGE_W - MARGIN - sigBoxWidth;

  page.drawRectangle({
    x: sigX,
    y: y - sigBoxHeight,
    width: sigBoxWidth,
    height: sigBoxHeight,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  drawText(
    page,
    bold,
    "Signature et bon pour accord",
    sigX + 10,
    y - 18,
    9,
    BLUE,
  );

  drawText(page, regular, "Date :", sigX + 10, y - 38, 8);
  drawText(page, regular, "Nom du signataire :", sigX + 10, y - 54, 8);

  drawText(
    page,
    italic,
    "Précédé de la mention « Bon pour accord »",
    sigX + 10,
    y - sigBoxHeight + 10,
    7,
    [0.5, 0.5, 0.5],
  );

  y -= sigBoxHeight + 20;

  // ── Footer ──
  const ftrParts: string[] = [
    data.company.name,
    data.company.email,
    data.company.phone,
  ].filter((x): x is string => !!x);
  for (const p of pdfDoc.getPages()) {
    p.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: 32,
      color: rgb(GRAY[0], GRAY[1], GRAY[2]),
    });
    let fx = MARGIN;
    for (const part of ftrParts) {
      drawText(p, regular, part, fx, 10, 8, [0.4, 0.4, 0.4]);
      fx += part.length * 4.5 + 20;
    }
  }

  applyPdfACompliance(pdfDoc, data.facturXxml);
  return pdfDoc.save();
}
