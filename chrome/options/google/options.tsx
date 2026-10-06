import { Engines, IEngineOptionsProps } from "../../const";
import React, { ChangeEventHandler } from "react";
import { getLanguagesFromGoogleUrl, google_languages, IGoogleLanguage } from "./languages";
import { Field, Switch } from "../components";

interface IGoogleTranslateLanguageSelectProps {
  value: string;
  type: "from" | "to";
  onLanguageChange: (type: string, newLanguageCode: string) => void;
}

const customLanguage: IGoogleLanguage = {
  language_name: "Custom",
  language_code: "custom",
};

const GoogleTranslateLanguageSelect = ({
  value,
  type,
  onLanguageChange,
}: IGoogleTranslateLanguageSelectProps) => {
  const selectId = `translate_${type}`;
  const onChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    onLanguageChange(type, event.target.value);
  };
  return (
    <Field label={type === "from" ? "From" : "To"} htmlFor={selectId}>
      <select id={selectId} value={value} onChange={onChange}>
        {[...google_languages, customLanguage].map((lang) => (
          <option
            key={lang.language_code}
            value={lang.language_code}
            hidden={lang.language_code === customLanguage.language_code}
          >
            {lang.language_name}
          </option>
        ))}
      </select>
    </Field>
  );
};

export const GoogleTranslateEngineOptions = ({
  selectedEngine,
  onEngineUpdate,
}: IEngineOptionsProps) => {
  const { url: selectedEngineUrl, autoread, name } = selectedEngine;
  if (name !== Engines.GOOGLE_TRANSLATE) {
    return null;
  }
  const onAutoreadChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onEngineUpdate({
      ...selectedEngine,
      autoread: e.target.checked,
    });
  };
  const onLanguageChange = (type: string, langCode: string) => {
    const prevUrl = selectedEngineUrl;
    let newUrl: string;
    if (type === "to") {
      newUrl = prevUrl.replace(/(#[\w-]+\/)[\w-]+\//, `$1${langCode}/`);
    } else {
      newUrl = prevUrl.replace(/#[\w-]+\//, `#${langCode}/`);
    }
    onEngineUpdate({
      ...selectedEngine,
      url: newUrl,
    });
  };
  let from, to;
  let urlError = false;
  try {
    const languages = getLanguagesFromGoogleUrl(selectedEngineUrl);
    from = languages.from;
    to = languages.to;
  } catch (e) {
    urlError = true;
    from = to = customLanguage.language_code;
  }
  return (
    <div id="google_lang_controls">
      <div className="field-row">
        <GoogleTranslateLanguageSelect
          type="from"
          value={from}
          onLanguageChange={onLanguageChange}
        />
        <GoogleTranslateLanguageSelect type="to" value={to} onLanguageChange={onLanguageChange} />
      </div>
      {urlError && (
        <p className="hint error">
          The URL uses languages that aren&apos;t in this list. Restore defaults to choose them here
          again.
        </p>
      )}
      <Switch
        id="auto_read"
        label="Read the translation aloud"
        checked={!!autoread}
        onChange={onAutoreadChange}
      />
    </div>
  );
};

export const GoogleTranslateExtEngineOptions = ({ selectedEngine }: IEngineOptionsProps) => {
  const { name } = selectedEngine;
  if (name !== Engines.GOOGLE_TRANSLATE_EXT) {
    return null;
  }
  return (
    <p className="note">
      Requires the{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href="https://chrome.google.com/webstore/detail/google-translate/aapbdbdomjkkjkaonfhkkikfgjllcleb?hl=en"
      >
        Google Translate extension
      </a>
      . Translating the whole page with it shows the recognized text in place of the page.
    </p>
  );
};
