import { waitUntilNotNull } from "../utils";

const kindleIframeId = "KindleReaderIFrame";
const kindleContentAreaId = "kindleReader_content";
const kindleTextClass = "kg-client-dictionary";
const kindleTextSelectionClass = "kg-client-selection";

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
    const kindleIframe = document.getElementById(kindleIframeId) as HTMLIFrameElement | null;
    const kindleIframeDocument = kindleIframe?.contentWindow?.document;
    const kindleContentArea: HTMLElement | null | undefined =
      kindleIframeDocument?.getElementById(kindleContentAreaId);
    const locationDataContainer: HTMLElement | null | undefined =
      kindleIframeDocument?.getElementById("kindleReader_locationPopup_labelDiv");
    if (!kindleContentArea || !locationDataContainer) {
      return null;
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

export function translateSelected(
  { kindleContentArea }: IKindleCenterElements,
  selectedAreas: HTMLSpanElement[] = []
) {
  if (!selectedAreas.length) {
    return;
  }

  const interactionLayer = kindleContentArea;
  const pageImage: HTMLImageElement | null = interactionLayer.querySelector(".kg-full-page-img");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!pageImage || !ctx) {
    return;
  }
  canvas.width = pageImage.clientWidth;
  canvas.height = pageImage.clientHeight;

  const columnElements = interactionLayer.querySelectorAll(".kg-client-interaction-layer > div");
  const columns = (Array.from(columnElements) as HTMLDivElement[]).map((el) => {
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

  const topLeftSelectionPosition = {
    left: 0,
    top: 0,
  };

  const region = new Path2D();
  selectedAreas.forEach((selection, index) => {
    const { left, width, top, height } = selection.style;
    const pixels = [left, top, width, height].map((px) => strPxToFloat(px)) as [
      number,
      number,
      number,
      number
    ];
    region.rect(...pixels);
    if (index === 0) {
      topLeftSelectionPosition.left = pixels[0];
      topLeftSelectionPosition.top = pixels[1];
    }
  });
  ctx.clip(region);
  ctx.drawImage(pageImage, 0, 0, pageImage.clientWidth, pageImage.clientHeight);
  const dataUrl = canvas.toDataURL();
  return {
    dataUrl,
    columns,
    topLeftSelection: topLeftSelectionPosition,
  };
}
