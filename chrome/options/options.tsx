import React, { ChangeEventHandler, useEffect, useState } from 'react'
import { Engines, ITranslateEngine, supportedOcrLangs } from '../const'
import { DictCCEngineOptions } from './dict/options'
import { GoogleTranslateEngineOptions, GoogleTranslateExtEngineOptions } from './google/options'
import { Storage } from '../services/storage'
import { showMessage } from './utils'

interface IEngineSelectProps {
  translateEngines: ITranslateEngine[],
  onChangeEngine: (value: Engines) => void,
  selectedEngineName: string,
}

const EnginesSelect = ({ translateEngines, onChangeEngine, selectedEngineName }: IEngineSelectProps) => {
  const onSelect: ChangeEventHandler<HTMLSelectElement> = (event) => {
    onChangeEngine(event.target.value as Engines);
  }
  return (
    <select id="translate_engine" onChange={onSelect} value={selectedEngineName}>
      {
        translateEngines.map(
          (engine) =>
            <option key={engine.name} value={engine.name}>
              {engine.label}
            </option>
        )
      }
    </select>
  )
}

const Options = () => {
  const storage = new Storage();
  const [loadedFromStorage, setLoaded] = useState<boolean>(false);
  const [engines, setEngines] = useState<ITranslateEngine[]>([]);
  const [ocrLangs, setOcrLangs] = useState<string>("eng");
  const onChangeEngine = (engineName: Engines) => {
    onEngineUpdate({
      ...engines.find((t) => t.name === engineName)!,
      selected: true,
    })
  }
  const onEngineUpdate = (newEngineData: ITranslateEngine) => {
    const { selected } = newEngineData;
    const newEngines = engines.map(e => {
      if (newEngineData.name === e.name) {
        return newEngineData;
      }
      if (e.selected && selected) {
        return {
          ...e,
          selected: false,
        }
      }
      return e;
    })
    setEngines(newEngines);
  }
  const onOcrLanguageSelect: ChangeEventHandler<HTMLSelectElement> = (event) => {
    setOcrLangs(event.target.value);
  }
  const onSaveBtnClick = () => {
    storage.updateValues(engines, ocrLangs).then(() => {
      showMessage("saved_message");
    })
  }
  const onRestoreBtnClick = () => {
    storage.restoreDefaultSettings().then(({translateEngines, ocrLangs}) => {
      showMessage("defaults_restored_message");
      setEngines(translateEngines);
      setOcrLangs(ocrLangs);
    })
  }
  useEffect(() => {
    // load data from storage
    const loadFromStorage = async () => {
      const ocrLangsStored = await storage.getOcrLangs();
      setOcrLangs(ocrLangsStored);
      const engines = await storage.getTranslateEngines();
      setEngines(engines);
      setLoaded(true);
    }
    void loadFromStorage();
  }, [])
  if (!loadedFromStorage) {
    return <div className="section" />;
  }
  const selectedEngine = engines.find(e => e.selected)!;
  const onChangeUrl: ChangeEventHandler<HTMLInputElement> = (event) => {
    onEngineUpdate({
      ...selectedEngine,
      url: event.target.value,
    })
  }
  return (
    <div className="section">
      <div className="container">
        <form id="shortcutsForm" name="shortcutsForm">
          <div className="row container center-content">
            <label htmlFor="ocrLangs">
              Detect Languages (
              <a
                target="_blank"
                href="https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016"
              >list of supported languages</a>)
            </label>
            <select className="u-full-width" id="ocrLangs" value={ocrLangs} onChange={onOcrLanguageSelect}>
              {
                supportedOcrLangs.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))
              }
            </select>
            <EnginesSelect
              translateEngines={engines}
              onChangeEngine={onChangeEngine}
              selectedEngineName={selectedEngine.name}
            />
            {selectedEngine.name !== Engines.GOOGLE_TRANSLATE_EXT && (
              <>
                <label htmlFor="url">Url</label>
                <input className="u-full-width" type="text" id="url" value={selectedEngine.url} onChange={onChangeUrl} />
              </>
            )}
            <GoogleTranslateEngineOptions selectedEngine={selectedEngine} onEngineUpdate={onEngineUpdate} />
            <DictCCEngineOptions selectedEngine={selectedEngine} onEngineUpdate={onEngineUpdate} />
            <GoogleTranslateExtEngineOptions selectedEngine={selectedEngine} onEngineUpdate={onEngineUpdate} />
            <div className="row container center-content">
              <a id="restore_defaults_btn" className="button-primary button" onClick={onRestoreBtnClick}>
                Restore Defaults
              </a> <a id="save_btn" className="button-primary button" onClick={onSaveBtnClick}>Save</a>
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
}

export default Options;
