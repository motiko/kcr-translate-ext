import { ITranslateEngine } from "../../chrome/const";

export interface ISettingsPuppeteer {
  translationEnabled?: boolean;
  selectedEngine?: Partial<ITranslateEngine>;
}
