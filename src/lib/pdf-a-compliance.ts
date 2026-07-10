import type { PDFDocument } from "pdf-lib";
import {
  PDFName,
  PDFDict,
  PDFRawStream,
  PDFArray,
  PDFHexString,
  PDFString,
  PDFNumber,
} from "pdf-lib";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ICC_PROFILE_PATH = path.join(
  process.cwd(),
  "src/lib/profils/sRGB2014.icc",
);

export function sanitizeTextForPdf(text: string): string {
  return text
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00B0/g, "\u00B0")
    .replace(/\u2022/g, "-")
    .replace(/\u00AB|\u00BB/g, '"')
    .replace(/\u20AC/g, "\u20AC")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\u00A7/g, "\u00A7");
}

function buildXmpMetadata(): string {
  return [
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '    <rdf:Description rdf:about=""',
    '      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">',
    "      <pdfaid:part>3</pdfaid:part>",
    "      <pdfaid:conformance>B</pdfaid:conformance>",
    "    </rdf:Description>",
    '    <rdf:Description rdf:about=""',
    '      xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "      <dc:creator>",
    "        <rdf:Seq>",
    "          <rdf:li>Facturation App</rdf:li>",
    "        </rdf:Seq>",
    "      </dc:creator>",
    "    </rdf:Description>",
    '    <rdf:Description rdf:about=""',
    '      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">',
    "      <fx:DocumentType>INVOICE</fx:DocumentType>",
    "      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>",
    "      <fx:Version>1.0</fx:Version>",
    "      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>",
    "    </rdf:Description>",
    '    <rdf:Description rdf:about=""',
    '      xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"',
    '      xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"',
    '      xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">',
    "      <pdfaExtension:schemas>",
    "        <rdf:Bag>",
    '          <rdf:li rdf:parseType="Resource">',
    "            <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>",
    "            <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>",
    "            <pdfaSchema:prefix>fx</pdfaSchema:prefix>",
    "            <pdfaSchema:property>",
    "              <rdf:Seq>",
    '                <rdf:li rdf:parseType="Resource">',
    "                  <pdfaProperty:name>DocumentFileName</pdfaProperty:name>",
    "                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>",
    "                  <pdfaProperty:category>external</pdfaProperty:category>",
    "                  <pdfaProperty:description>The name of the embedded XML document</pdfaProperty:description>",
    "                </rdf:li>",
    '                <rdf:li rdf:parseType="Resource">',
    "                  <pdfaProperty:name>DocumentType</pdfaProperty:name>",
    "                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>",
    "                  <pdfaProperty:category>external</pdfaProperty:category>",
    "                  <pdfaProperty:description>The type of the hybrid document in capital letters, e.g. INVOICE or ORDER</pdfaProperty:description>",
    "                </rdf:li>",
    '                <rdf:li rdf:parseType="Resource">',
    "                  <pdfaProperty:name>Version</pdfaProperty:name>",
    "                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>",
    "                  <pdfaProperty:category>external</pdfaProperty:category>",
    "                  <pdfaProperty:description>The actual version of the standard applying to the embedded XML document</pdfaProperty:description>",
    "                </rdf:li>",
    '                <rdf:li rdf:parseType="Resource">',
    "                  <pdfaProperty:name>ConformanceLevel</pdfaProperty:name>",
    "                  <pdfaProperty:valueType>Text</pdfaProperty:valueType>",
    "                  <pdfaProperty:category>external</pdfaProperty:category>",
    "                  <pdfaProperty:description>The conformance level of the embedded XML document</pdfaProperty:description>",
    "                </rdf:li>",
    "              </rdf:Seq>",
    "            </pdfaSchema:property>",
    "          </rdf:li>",
    "        </rdf:Bag>",
    "      </pdfaExtension:schemas>",
    "    </rdf:Description>",
    "  </rdf:RDF>",
    "</x:xmpmeta>",
    '<?xpacket end="w"?>',
  ].join("\n");
}

export function applyPdfACompliance(
  pdfDoc: PDFDocument,
  facturXxml: Uint8Array,
) {
  const context = (pdfDoc as any).context;

  const catalogRef = context.trailerInfo.Root;
  const catalog = context.lookup(catalogRef);

  const iccProfileBytes = fs.readFileSync(ICC_PROFILE_PATH);
  const iccStreamMap = new Map<PDFName, any>();
  iccStreamMap.set(PDFName.of("N"), PDFNumber.of(3));
  const iccStream = PDFRawStream.of(
    PDFDict.fromMapWithContext(iccStreamMap, context),
    iccProfileBytes,
  );
  const iccStreamRef = context.register(iccStream);

  const oiMap = new Map<PDFName, any>();
  oiMap.set(PDFName.of("Type"), PDFName.of("OutputIntent"));
  oiMap.set(PDFName.of("S"), PDFName.of("GTS_PDFA1"));
  oiMap.set(PDFName.of("DestOutputProfile"), iccStreamRef);
  oiMap.set(PDFName.of("OutputConditionIdentifier"), PDFString.of("sRGB IEC61966-2-1"));
  oiMap.set(PDFName.of("Info"), PDFString.of("sRGB"));
  oiMap.set(PDFName.of("RegistryName"), PDFString.of("http://www.color.org"));
  const outputIntentRef = context.register(
    PDFDict.fromMapWithContext(oiMap, context),
  );

  const outputIntentsArray = PDFArray.withContext(context);
  outputIntentsArray.push(outputIntentRef);
  catalog.set(PDFName.of("OutputIntents"), outputIntentsArray);

  const xmpBytes = new TextEncoder().encode(buildXmpMetadata());
  const xmpStreamMap = new Map<PDFName, any>();
  xmpStreamMap.set(PDFName.of("Type"), PDFName.of("Metadata"));
  xmpStreamMap.set(PDFName.of("Subtype"), PDFName.of("XML"));
  const xmpStream = PDFRawStream.of(
    PDFDict.fromMapWithContext(xmpStreamMap, context),
    xmpBytes,
  );
  catalog.set(PDFName.of("Metadata"), context.register(xmpStream));

  for (const p of pdfDoc.getPages()) {
    const groupMap = new Map<PDFName, any>();
    groupMap.set(PDFName.of("Type"), PDFName.of("Group"));
    groupMap.set(PDFName.of("S"), PDFName.of("Transparency"));
    groupMap.set(PDFName.of("CS"), PDFName.of("DeviceRGB"));
    (p as any).node.set(
      PDFName.of("Group"),
      PDFDict.fromMapWithContext(groupMap, context),
    );
  }

  const id1 = crypto.randomBytes(16);
  const id2 = crypto.randomBytes(16);
  const idArray = PDFArray.withContext(context);
  idArray.push(PDFHexString.of(id1.toString("hex")));
  idArray.push(PDFHexString.of(id2.toString("hex")));
  context.trailerInfo.ID = idArray;

  const efParamsMap = new Map<PDFName, any>();
  efParamsMap.set(PDFName.of("Size"), PDFNumber.of(facturXxml.length));
  const efParamsDict = PDFDict.fromMapWithContext(efParamsMap, context);

  const efStreamMap = new Map<PDFName, any>();
  efStreamMap.set(PDFName.of("Type"), PDFName.of("EmbeddedFile"));
  efStreamMap.set(PDFName.of("Subtype"), PDFName.of("text/xml"));
  efStreamMap.set(PDFName.of("Params"), efParamsDict);
  const efStream = PDFRawStream.of(
    PDFDict.fromMapWithContext(efStreamMap, context),
    facturXxml,
  );
  const efStreamRef = context.register(efStream);

  const efEntryMap = new Map<PDFName, any>();
  efEntryMap.set(PDFName.of("F"), efStreamRef);
  efEntryMap.set(PDFName.of("UF"), efStreamRef);
  const efEntryDict = PDFDict.fromMapWithContext(efEntryMap, context);

  const fsMap = new Map<PDFName, any>();
  fsMap.set(PDFName.of("Type"), PDFName.of("Filespec"));
  fsMap.set(PDFName.of("F"), PDFString.of("factur-x.xml"));
  fsMap.set(PDFName.of("UF"), PDFString.of("factur-x.xml"));
  fsMap.set(PDFName.of("Desc"), PDFString.of("Factur-X Invoice Data"));
  fsMap.set(PDFName.of("AFRelationship"), PDFName.of("Data"));
  fsMap.set(PDFName.of("EF"), efEntryDict);
  const fsRef = context.register(
    PDFDict.fromMapWithContext(fsMap, context),
  );

  const namesArray = PDFArray.withContext(context);
  namesArray.push(PDFString.of("factur-x.xml"));
  namesArray.push(fsRef);

  const efNameTreeMap = new Map<PDFName, any>();
  efNameTreeMap.set(PDFName.of("Names"), namesArray);
  const efNameTree = PDFDict.fromMapWithContext(efNameTreeMap, context);

  const namesMap = new Map<PDFName, any>();
  namesMap.set(PDFName.of("EmbeddedFiles"), efNameTree);
  catalog.set(
    PDFName.of("Names"),
    PDFDict.fromMapWithContext(namesMap, context),
  );

  const afArray = PDFArray.withContext(context);
  afArray.push(fsRef);
  catalog.set(PDFName.of("AF"), afArray);
}
