import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void; closeLabel?: string; dismissible?: boolean };

/** Accessible shared modal. Its overlay begins below the persistent app header. */
export function Modal({ open, title, description, children, onClose, closeLabel = "Close dialog", dismissible = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && dismissible) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [open, onClose, dismissible]);
  if (!open) return null;
  return <div className="wf-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && dismissible) onClose(); }}>
    <section className="wf-modal" role="dialog" aria-modal="true" aria-labelledby="wf-modal-title" aria-describedby={description ? "wf-modal-description" : undefined}>
      <div className="wf-modal-heading"><div><h2 id="wf-modal-title">{title}</h2>{description && <p id="wf-modal-description">{description}</p>}</div><button className="wf-modal-close" type="button" aria-label={closeLabel} onClick={onClose}><X size={18}/></button></div>
      <div className="wf-modal-content">{children}</div>
    </section>
  </div>;
}
type ConfirmDialogProps = { open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void };
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Cancel", destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
 return <Modal open={open} title={title} description={description} onClose={onCancel}><div className="wf-modal-actions"><button type="button" className="wf-button wf-button--secondary" onClick={onCancel}>{cancelLabel}</button><button type="button" className={destructive ? "wf-button wf-button--danger" : "wf-button"} onClick={onConfirm}>{confirmLabel}</button></div></Modal>;
}
