import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "md", leadingIcon, trailingIcon, fullWidth, className = "", children, ...props }: ButtonProps) {
  return <button className={["wf-button", `wf-button--${variant}`, `wf-button--${size}`, fullWidth ? "wf-button--full" : "", className].filter(Boolean).join(" ")} {...props}>
    {leadingIcon ? <span className="wf-button__icon">{leadingIcon}</span> : null}<span>{children}</span>{trailingIcon ? <span className="wf-button__icon">{trailingIcon}</span> : null}
  </button>;
}

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={["wf-card", className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger"; children: ReactNode }) {
  return <span className={`wf-badge wf-badge--${tone}`}>{children}</span>;
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, id, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hintId = hint || error ? `${inputId}-hint` : undefined;
  return <label className="wf-field" htmlFor={inputId}>
    <span className="wf-field__label">{label}</span>
    <input id={inputId} className={["wf-input", error ? "wf-input--error" : "", className].filter(Boolean).join(" ")} aria-invalid={Boolean(error)} aria-describedby={hintId} {...props} />
    {hint || error ? <span id={hintId} className={error ? "wf-field__error" : "wf-field__hint"}>{error ?? hint}</span> : null}
  </label>;
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextAreaField({ label, hint, error, id, className = "", ...props }: TextAreaFieldProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hintId = hint || error ? `${inputId}-hint` : undefined;
  return <label className="wf-field" htmlFor={inputId}>
    <span className="wf-field__label">{label}</span>
    <textarea id={inputId} className={["wf-input wf-textarea", error ? "wf-input--error" : "", className].filter(Boolean).join(" ")} aria-invalid={Boolean(error)} aria-describedby={hintId} {...props} />
    {hint || error ? <span id={hintId} className={error ? "wf-field__error" : "wf-field__hint"}>{error ?? hint}</span> : null}
  </label>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="wf-section-heading"><div>{eyebrow ? <p className="wf-eyebrow">{eyebrow}</p> : null}<h2>{title}</h2>{description ? <p className="wf-section-heading__description">{description}</p> : null}</div>{action ? <div className="wf-section-heading__action">{action}</div> : null}</div>;
}

export function EmptyState({ emoji = "🧇", title, description, action }: { emoji?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="wf-empty-state"><span className="wf-empty-state__emoji" aria-hidden="true">{emoji}</span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Butters({ mood = "happy", size = "md", label = "Butters the Waffle" }: { mood?: "happy" | "thinking" | "celebrating"; size?: "sm" | "md" | "lg"; label?: string }) {
  return <span className={`wf-butters wf-butters--${size} wf-butters--${mood}`} role="img" aria-label={label}><span className="wf-butters__art-placeholder" aria-hidden="true"><span className="wf-butters__placeholder-icon">✦</span><span className="wf-butters__placeholder-label">Butters art</span></span><span className="wf-butters__face" aria-hidden="true">{mood === "thinking" ? "?" : mood === "celebrating" ? "✦" : "•"}</span></span>;
}

export function IconButton({ label, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={["wf-icon-button", className].filter(Boolean).join(" ")} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Divider(props: HTMLAttributes<HTMLHRElement>) {
  return <hr className={["wf-divider", props.className].filter(Boolean).join(" ")} {...props} />;
}
