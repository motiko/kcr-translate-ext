import React, { Suspense } from "react";
import { Settings } from "../../services/settings";
import { waitForKindleCenter } from "./utils";
import { DetectedTextContainer } from "./DetectedTextContainer";
import { KindleCloudReaderListener } from "./KCRListener/KindleCloudReaderListener";
import { OCR } from "./OCR";

const createListenerComponent = async (
  settingsService: Settings
): Promise<{ default: React.FC }> => {
  const settings = await settingsService.getAllSettings();
  console.log("translateengines: ", settings.translateEngines);
  const kindleElements = await waitForKindleCenter();
  const ListenerWrapper: React.FC = ({ children }) => {
    return (
      <KindleCloudReaderListener settings={settings} kindleElements={kindleElements}>
        {children}
      </KindleCloudReaderListener>
    );
  };
  return { default: ListenerWrapper };
};

const KindleContentScript = () => {
  const settingsService = new Settings();
  const Wrapper = React.lazy(() => createListenerComponent(settingsService));
  return (
    <Suspense fallback={<div />}>
      <Wrapper>
        <DetectedTextContainer />
        <OCR />
      </Wrapper>
    </Suspense>
  );
};

export default KindleContentScript;
