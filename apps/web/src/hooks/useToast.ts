import { useCallback, useEffect, useRef, useState } from "react";
export type ToastMessage = { id: number; message: string; kind: "success" | "error" | "info" };
/** Reusable toast state with automatic dismissal and timer cleanup. */
export function useToast() {
 const [toast,setToast] = useState<ToastMessage|null>(null);
 const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
 const dismiss = useCallback(()=>{ if(timer.current) clearTimeout(timer.current); timer.current=null; setToast(null); },[]);
 const show = useCallback((message:string,kind:ToastMessage["kind"]="info",duration=4200)=>{ if(timer.current) clearTimeout(timer.current); setToast({id:Date.now(),message,kind}); timer.current=setTimeout(()=>{setToast(null);timer.current=null;},duration); },[]);
 useEffect(()=>()=>{if(timer.current) clearTimeout(timer.current);},[]);
 return {toast,show,dismiss};
}
