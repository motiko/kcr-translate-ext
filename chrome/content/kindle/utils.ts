import { waitUntilNotNull } from "../utils";
import { IDimensions } from "../../const";

const kindleIframeId = "KindleReaderIFrame";
const kindleContentAreaId = "kindleReader_content";
const kindleTextClass = "kg-client-dictionary";
const kindleTextSelectionClass = "kg-selection";
export const detectedTextContainerId = "kcr-selection";

export enum TranslationStatus {
  IDLE = "IDLE",
  STARTED = "STARTED",
  FINISHED = "FINISHED",
}

export interface IKindleCenterElements {
  kindleIframeDocument: Document;
  kindleContentArea: HTMLElement;
  locationDataContainer: HTMLElement;
}

export const waitForKindleCenter = async (): Promise<IKindleCenterElements> => {
  const kindleElementsGetter = (): IKindleCenterElements | null => {
    const kindleIframeDocument = document;
    const kindleContentArea: HTMLElement | null | undefined =
      kindleIframeDocument?.getElementById("root");
    const locationDataContainer: HTMLElement | null | undefined =
      kindleIframeDocument?.getElementById("kr-fullpage-app");
    // console.debug("locationDataContainer", locationDataContainer);
    // console.debug("kindleContenArea", kindleContentArea);
    // console.debug("kindleIframe", kindleIframeDocument);
    if (!kindleContentArea || !locationDataContainer) {
      console.error("KCR translate kindle objects not found: locationDataContainer, kindleContentArea ");
    }
    return {
      kindleIframeDocument: kindleIframeDocument!,
      kindleContentArea: kindleContentArea!,
      locationDataContainer: locationDataContainer!,
    };
  };
  return waitUntilNotNull(kindleElementsGetter);
};

export const isKindleText = (e: HTMLElement) => e.classList.contains(kindleTextClass);
export const getAllTexts = (kindleElements: IKindleCenterElements): HTMLSpanElement[] =>
  Array.from(kindleElements.kindleContentArea.querySelectorAll(`.${kindleTextClass}`));
export const getAllSelectedTexts = (kindleElements: IKindleCenterElements): HTMLSpanElement[] =>
  Array.from(kindleElements.kindleContentArea.querySelectorAll(`.${kindleTextSelectionClass}`));

export const strPxToFloat = (val: string): number => Number(val.replace("px", ""));

// Tesseract expects dark text on a light background. KCR's dark themes render the page image
// as light text on a dark background, and the pixels outside the selection are transparent.
// Convert to grayscale, invert dark pages, and paint everything outside the selection white.
function normalizeForOcr(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let lumaSum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = luma;
    if (data[i + 3] > 0) {
      lumaSum += luma;
      count++;
    }
  }
  // the background dominates the selected area, so its average tells light from dark themes
  const isDark = count > 0 && lumaSum / count < 128;
  for (let i = 0; i < data.length; i += 4) {
    const luma = isDark ? 255 - data[i] : data[i];
    const alpha = data[i + 3] / 255;
    const value = luma * alpha + 255 * (1 - alpha);
    data[i] = data[i + 1] = data[i + 2] = value;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function transformSelected(
  { kindleContentArea }: IKindleCenterElements,
  selectedAreas: HTMLSpanElement[] = []
) {
  if (!selectedAreas.length) {
    return null;
  }

  const interactionLayer = kindleContentArea;
  const pageImage: HTMLImageElement | null = interactionLayer.querySelector(".kg-full-page-img img");
  console.debug("pageImage", pageImage)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!pageImage || !ctx) {
    console.error("pageImage or ctx not defined");
    return null;
  }
  canvas.width = pageImage.clientWidth;
  canvas.height = pageImage.clientHeight;

  const columnElements = interactionLayer.querySelectorAll(".kg-client-interaction-layer > div");
  const columns: IDimensions[] = (Array.from(columnElements) as HTMLDivElement[]).map((el) => {
    const { left, width } = el.style;
    const leftNum = strPxToFloat(left);
    const widthNum = strPxToFloat(width);
    return {
      left: leftNum,
      top: 0,
      width: widthNum - leftNum,
      height: pageImage.clientHeight,
    };
  });
  // console.debug("columns", columns);

  const region = new Path2D();
  selectedAreas.forEach((selection) => {
    const { left, width, top, height } = selection.style;
    const pixels = [left, top, width, height].map((px) => strPxToFloat(px)) as [
      number,
      number,
      number,
      number
    ];
    // console.debug("pixels", pixels);
    region.rect(...pixels);
  });
  ctx.clip(region);
  ctx.drawImage(pageImage, 0, 0, pageImage.clientWidth, pageImage.clientHeight);
  normalizeForOcr(ctx, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL();
  // console.debug(dataUrl);
  return {
    dataUrl,
    columns,
  };
}
