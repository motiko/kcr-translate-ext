import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { Engines, ITranslateEngine } from "../const";
import { DictCCEngineOptions } from "./dict/options";
import { GoogleTranslateEngineOptions, GoogleTranslateExtEngineOptions } from "./google/options";
import { Settings } from "../services/settings";
import { Field, Switch } from "./components";

const settingsService = new Settings();

interface IStatus {
  text: string;
  tone: "success" | "error";
}

const snapshot = (engines: ITranslateEngine[]) => JSON.stringify(engines);

const Options = () => {
  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [engines, setEngines] = useState<ITranslateEngine[]>([]);
  const [isTranslationEnabled, setTranslationEnabled] = useState<boolean>(true);
  // the stored values, to tell whether there is anything to save
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const [status, setStatus] = useState<IStatus | null>(null);
  const statusTimer = useRef<number>();

  const showStatus = (newStatus: IStatus) => {
    window.clearTimeout(statusTimer.current);
    setStatus(newStatus);
    statusTimer.current = window.setTimeout(() => setStatus(null), 2500);
  };

  useEffect(() => {
    const loadFromStorage = async () => {
      const [storedEngines, translationEnabled] = await Promise.all([
        settingsService.getTranslateEngines(),
        settingsService.getTranslationEnabled(),
      ]);
      setEngines(storedEngines);
      setTranslationEnabled(translationEnabled);
      setSavedSnapshot(snapshot(storedEngines));
      setLoaded(true);
    };
    void loadFromStorage();
    return () => window.clearTimeout(statusTimer.current);
  }, []);

  const onTranslationToggle: ChangeEventHandler<HTMLInputElement> = (event) => {
    const enabled = event.target.checked;
    setTranslationEnabled(enabled);
    settingsService.setTranslationEnabled(enabled).catch(() => {
      setTranslationEnabled(!enabled);
      showStatus({ text: "Couldn't change translation.", tone: "error" });
    });
  };

  const onEngineUpdate = (newEngineData: ITranslateEngine) => {
    const { selected } = newEngineData;
    setEngines(
      engines.map((e) => {
        if (newEngineData.name === e.name) {
          return newEngineData;
        }
        if (e.selected && selected) {
          return { ...e, selected: false };
        }
        return e;
      })
    );
  };

  const onChangeEngine: ChangeEventHandler<HTMLSelectElement> = (event) => {
    onEngineUpdate({
      ...engines.find((t) => t.name === event.target.value)!,
      selected: true,
    });
  };

  const onSave = () => {
    settingsService
      .updateValues(engines)
      .then(() => {
        setSavedSnapshot(snapshot(engines));
        showStatus({ text: "Settings saved", tone: "success" });
      })
      .catch(() => showStatus({ text: "Couldn't save settings.", tone: "error" }));
  };

  const onRestore = () => {
    settingsService.restoreDefaultSettings().then(({ translateEngines, translationEnabled }) => {
      setEngines(translateEngines);
      setTranslationEnabled(translationEnabled);
      setSavedSnapshot(snapshot(translateEngines));
      showStatus({ text: "Default settings restored", tone: "success" });
    });
  };

  if (!isLoaded) {
    return null;
  }

  const selectedEngine = engines.find((e) => e.selected)!;
  const isDirty = snapshot(engines) !== savedSnapshot;
  const onChangeUrl: ChangeEventHandler<HTMLInputElement> = (event) => {
    onEngineUpdate({ ...selectedEngine, url: event.target.value });
  };

  return (
    <main className="options">
      <header className="header">
        <img src="img/book_32.png" alt="" width={28} height={28} />
        <h1>KCR Translate</h1>
        <Switch
          id="translation_enabled"
          label={isTranslationEnabled ? "On" : "Off"}
          checked={isTranslationEnabled}
          onChange={onTranslationToggle}
          data-cy="kcrt-options-toggle-translation"
        />
      </header>

      <form
        className={isTranslationEnabled ? "" : "is-disabled"}
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <section className="card" aria-labelledby="translation_heading">
          <h2 id="translation_heading">Translation</h2>
          <Field label="Translate with" htmlFor="translate_engine">
            <select id="translate_engine" value={selectedEngine.name} onChange={onChangeEngine}>
              {engines.map((engine) => (
                <option key={engine.name} value={engine.name}>
                  {engine.label}
                </option>
              ))}
            </select>
          </Field>
          <GoogleTranslateEngineOptions
            selectedEngine={selectedEngine}
            onEngineUpdate={onEngineUpdate}
          />
          <DictCCEngineOptions selectedEngine={selectedEngine} onEngineUpdate={onEngineUpdate} />
          <GoogleTranslateExtEngineOptions
            selectedEngine={selectedEngine}
            onEngineUpdate={onEngineUpdate}
          />
          {selectedEngine.name !== Engines.GOOGLE_TRANSLATE_EXT && (
            <details className="advanced" open={selectedEngine.name === Engines.CUSTOM}>
              <summary>URL</summary>
              <Field
                label="Translation URL"
                htmlFor="url"
                hint="The recognized text is appended to this URL."
              >
                <input
                  type="url"
                  id="url"
                  spellCheck={false}
                  value={selectedEngine.url}
                  onChange={onChangeUrl}
                  placeholder="https://example.com/translate?q="
                />
              </Field>
            </details>
          )}
        </section>

        <footer className="actions">
          <p className={`status ${status?.tone ?? ""}`} role="status" aria-live="polite">
            {status?.text}
          </p>
          <button
            type="button"
            className="button ghost"
            onClick={onRestore}
            data-cy="kcrt-options-defaults"
          >
            Restore defaults
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!isDirty}
            data-cy="kcrt-options-save"
          >
            Save
          </button>
        </footer>
      </form>
    </main>
  );
};

export default Options;
