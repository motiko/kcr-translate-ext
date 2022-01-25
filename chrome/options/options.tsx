import React, { ChangeEventHandler, useEffect, useState } from "react";
import { Engines, ITranslateEngine, tesseractLangs } from "../const";
import { DictCCEngineOptions } from "./dict/options";
import {
  GoogleTranslateEngineOptions,
  GoogleTranslateExtEngineOptions,
} from "./google/options";
import { Settings } from "../services/settings";
import { showMessage } from "./utils";

interface IEngineSelectProps {
  translateEngines: ITranslateEngine[];
  onChangeEngine: (value: Engines) => void;
  selectedEngineName: string;
}

const EnginesSelect = ({
  translateEngines,
  onChangeEngine,
  selectedEngineName,
}: IEngineSelectProps) => {
  const onSelect: ChangeEventHandler<HTMLSelectElement> = (event) => {
    onChangeEngine(event.target.value as Engines);
  };
  return (
    <select
      id="translate_engine"
      onChange={onSelect}
      value={selectedEngineName}
    >
      {translateEngines.map((engine) => (
        <option key={engine.name} value={engine.name}>
          {engine.label}
        </option>
      ))}
    </select>
  );
};

const Options = () => {
  const settingsServise = new Settings();
  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [engines, setEngines] = useState<ITranslateEngine[]>([]);
  const [ocrLangs, setOcrLangs] = useState<string>("eng");
  const [isTranslationEnabled, setTranslationEnabled] = useState<boolean>();

  const onTranslationToggle = () => {
    setTranslationEnabled(!isTranslationEnabled);
    settingsServise
      .setTranslationEnabled(!isTranslationEnabled)
      .catch((error) => {
        setTranslationEnabled(!isTranslationEnabled);
      });
  };

  const onChangeEngine = (engineName: Engines) => {
    onEngineUpdate({
      ...engines.find((t) => t.name === engineName)!,
      selected: true,
    });
  };

  const onEngineUpdate = (newEngineData: ITranslateEngine) => {
    const { selected } = newEngineData;
    const newEngines = engines.map((e) => {
      if (newEngineData.name === e.name) {
        return newEngineData;
      }
      if (e.selected && selected) {
        return {
          ...e,
          selected: false,
        };
      }
      return e;
    });
    setEngines(newEngines);
  };

  const onOcrLanguageSelect: ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    setOcrLangs(event.target.value);
  };
  const onSaveBtnClick = () => {
    settingsServise.updateValues(engines, ocrLangs).then(() => {
      showMessage("saved_message");
    });
  };

  const onRestoreBtnClick = () => {
    settingsServise
      .restoreDefaultSettings()
      .then(({ translateEngines, ocrLangs, translationEnabled }) => {
        showMessage("defaults_restored_message");
        setEngines(translateEngines);
        setOcrLangs(ocrLangs);
        setTranslationEnabled(translationEnabled);
      });
  };

  useEffect(() => {
    // load data from settings servise
    const loadFromStorage = async () => {
      const ocrLangsStored = await settingsServise.getOcrLangs();
      setOcrLangs(ocrLangsStored);
      const engines = await settingsServise.getTranslateEngines();
      setEngines(engines);
      const translationEnabled = await settingsServise.getTranslationEnabled();
      setTranslationEnabled(translationEnabled);
      setLoaded(true);
    };
    void loadFromStorage();
  }, []);

  const selectedEngine = engines.find((e) => e.selected)!;
  const onChangeUrl: ChangeEventHandler<HTMLInputElement> = (event) => {
    onEngineUpdate({
      ...selectedEngine,
      url: event.target.value,
    });
  };

  if (!isLoaded) {
    return <div className="section" />;
  }
  return (
    <div className="section">
      <div className="container">
        <form id="shortcutsForm" name="shortcutsForm">
          <div className="row container center-content">
            <label htmlFor="ocrLangs">Translate From </label>
            <select
              className="u-full-width"
              id="ocrLangs"
              value={ocrLangs}
              onChange={onOcrLanguageSelect}
            >
              {Object.entries(tesseractLangs).map(([langKey, langName]) => (
                <option key={langKey} value={langKey}>
                  {langName}
                </option>
              ))}
            </select>
            <EnginesSelect
              translateEngines={engines}
              onChangeEngine={onChangeEngine}
              selectedEngineName={selectedEngine.name}
            />
            {selectedEngine.name !== Engines.GOOGLE_TRANSLATE_EXT && (
              <>
                <label htmlFor="url">Url</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="url"
                  value={selectedEngine.url}
                  onChange={onChangeUrl}
                />
              </>
            )}
            <GoogleTranslateEngineOptions
              selectedEngine={selectedEngine}
              onEngineUpdate={onEngineUpdate}
            />
            <DictCCEngineOptions
              selectedEngine={selectedEngine}
              onEngineUpdate={onEngineUpdate}
            />
            <GoogleTranslateExtEngineOptions
              selectedEngine={selectedEngine}
              onEngineUpdate={onEngineUpdate}
            />
            <div className="row container center-content">
              <a className="button-primary button" onClick={onRestoreBtnClick}>
                Restore Defaults
              </a>{" "}
              <a className="button-primary button" onClick={onSaveBtnClick}>
                Save
              </a>
              <a
                className="button-primary button"
                onClick={onTranslationToggle}
              >
                {isTranslationEnabled
                  ? "Disable Translation"
                  : "Enable Translation"}
              </a>
            </div>
            <div className="row container center-content">
              <div className="opaque message" id="saved_message">
                Settings saved.
              </div>
              <div className="opaque message" id="defaults_restored_message">
                Default settings restored.
              </div>
              <div className="opaque message error" id="error_message">
                An error occured, try restoring default settings.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Options;
