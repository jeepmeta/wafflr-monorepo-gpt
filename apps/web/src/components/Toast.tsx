import { X } from "lucide-react";
import type { ToastMessage } from "../hooks/useToast";
export function Toast({toast,onDismiss}:{toast:ToastMessage|null;onDismiss:()=>void}) {
 if(!toast) return null;
 return <div className={`toast-message toast-message--${toast.kind}`} role={toast.kind==="error"?"alert":"status"} key={toast.id}><span>{toast.message}</span><button type="button" onClick={onDismiss} aria-label="Dismiss notification"><X size={14}/></button></div>;
}
