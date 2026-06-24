import type { ReactNode } from "react";

export function AdminModal({ title, children, footer }: { title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="modal">
      <div className="modal-hdr"><div className="modal-title">{title}</div><button className="modal-close" type="button" aria-label="Close"><i className="ti ti-x" /></button></div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  );
}

export function QuickActionButton({ icon, children, href }: { icon: string; children: ReactNode; href?: string }) {
  const content = <><i className={`ti ti-${icon}`} />{children}</>;
  return href ? <a className="qa-btn" href={href}>{content}</a> : <button className="qa-btn" type="button" disabled>{content}</button>;
}
