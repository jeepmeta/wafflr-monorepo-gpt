import type { InputHTMLAttributes } from "react";

export type ArtworkInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
  inputClassName?: string;
};

/**
 * A real, accessible text input that can sit over transparent input-field art.
 * Set the outer class to size/position the artwork and input together.
 */
export function ArtworkInput({ className, inputClassName, ...props }: ArtworkInputProps) {
  return (
    <span className={["wf-artwork-input", className].filter(Boolean).join(" ")}>
      <input {...props} className={["wf-artwork-input__field", inputClassName].filter(Boolean).join(" ")} />
    </span>
  );
}
