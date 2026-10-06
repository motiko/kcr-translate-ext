import React, { ChangeEventHandler, ReactNode } from "react";

interface IFieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, hint, children }: IFieldProps) => (
  <div className="field">
    <label htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && <p className="hint">{hint}</p>}
  </div>
);

interface ISwitchProps {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  "data-cy"?: string;
}

// a checkbox styled as a switch, so it keeps native keyboard and form behavior
export const Switch = ({ id, label, checked, onChange, ...rest }: ISwitchProps) => (
  <label className="switch" htmlFor={id}>
    <span className="switch-label">{label}</span>
    <input
      type="checkbox"
      role="switch"
      id={id}
      checked={checked}
      onChange={onChange}
      data-cy={rest["data-cy"]}
    />
  </label>
);
