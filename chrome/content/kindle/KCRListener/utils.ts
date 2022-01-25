import { IKindleCenterElements } from "../utils";

export const isFullPageTranslation = () => !!document.querySelector(
  "html.translated-ltr, head.translated-rtl, ya-tr-span, *[_msttexthash]"
);

export function observePageEvents(
  kindleElements: IKindleCenterElements,
  setFullPageTranslationMode: (enabled: boolean) => void,
  onKindleLocationChange: VoidCallback
): VoidFunction {
  const { locationDataContainer } = kindleElements;
  const fullPageTranslationObserver = new MutationObserver(() => {
    const newValue = isFullPageTranslation();
    setFullPageTranslationMode(newValue);
  });

  fullPageTranslationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    childList: false,
    characterData: false,
  });
  const locationChangeObserver = new MutationObserver(() => {
    // user navigates to another page/location
    onKindleLocationChange();
  });
  locationDataContainer.classList.add("skiptranslate");
  locationChangeObserver.observe(locationDataContainer, {
    characterData: true,
    childList: true,
  });
  return () => {
    locationDataContainer.classList.remove("skiptranslate");
    fullPageTranslationObserver.disconnect();
    locationChangeObserver.disconnect();
  };
}
