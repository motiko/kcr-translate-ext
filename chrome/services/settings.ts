import { defaultTranslateEngines, ITranslateEngine } from "../const";

interface IStorageObjects {
  readonly ocrLangs: string;
  readonly translateEngines: ITranslateEngine[];
  readonly translationEnabled: boolean;
}

export class Settings {
  private ocrLangsKey = "ocrLangs";
  private translateEnginesKey = "translateEngines";
  private translationEnabledKey = "translationEnabled";

  private defaults: IStorageObjects = {
    translateEngines: defaultTranslateEngines as ITranslateEngine[],
    ocrLangs: "eng",
    translationEnabled: true,
  };

  setTranslationEnabled(enabled: boolean): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ translationEnabled: enabled }, () => {
        resolve();
      });
    });
  }

  getTranslationEnabled(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      chrome.storage.sync.get(
        this.translationEnabledKey,
        ({ translationEnabled = this.defaults.translationEnabled }) => {
          resolve(translationEnabled);
        }
      );
    });
  }

  getOcrLangs(): Promise<string> {
    return new Promise<string>((resolve) => {
      chrome.storage.sync.get(
        this.ocrLangsKey,
        ({ ocrLangs = this.defaults.ocrLangs }) => {
          resolve(ocrLangs);
        }
      );
    });
  }

  getTranslateEngines(): Promise<ITranslateEngine[]> {
    return new Promise<ITranslateEngine[]>((resolve) => {
      chrome.storage.sync.get(
        this.translateEnginesKey,
        ({ translateEngines }) => {
          let result: ITranslateEngine[] =
            translateEngines || this.defaults.translateEngines;
          const curTranslateEnginesNames = result.map((e) => e.name);
          this.defaults.translateEngines.forEach((engine) => {
            // check if `result` have all default engines
            if (!curTranslateEnginesNames.includes(engine.name)) {
              result.push(engine);
            }
          });
          resolve(result);
        }
      );
    });
  }

  async updateValues(
    engines: ITranslateEngine[],
    ocrLangs: string
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set(
        {
          translateEngines: engines,
          ocrLangs,
        },
        () => {
          chrome.runtime.sendMessage({ command: "RELOAD_SCRIPT" });
          resolve();
        }
      );
    });
  }

  async restoreDefaultSettings(): Promise<IStorageObjects> {
    return new Promise<IStorageObjects>((resolve) => {
      chrome.storage.sync.set(this.defaults, () => {
        resolve(this.defaults);
      });
    });
  }
}
