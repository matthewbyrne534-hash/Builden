// src/components/UI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { initials } from '../utils/helpers';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={wide ? { width: 700 } : {}}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{danger ? 'Delete' : 'Confirm'}</button>
      </>}>
      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
export function Breadcrumb({ items }) {
  return (
    <div className="breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="bc-sep">›</span>}
          {item.onClick
            ? <span className="bc-link" onClick={item.onClick}>{item.label}</span>
            : <span className="bc-current">{item.label}</span>
          }
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-wrap">
      <i className="ti ti-search search-icon" />
      <input className="search-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search...'} />
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>{t.label}</div>
      ))}
    </div>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size }) {
  return <div className="av" style={size ? { width: size, height: size, fontSize: size * 0.35 } : {}}>{initials(name)}</div>;
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ label, cls }) {
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, message, action }) {
  return (
    <div className="empty-state">
      <i className={`ti ti-${icon}`} />
      <p>{message}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

// ─── NOTICE ───────────────────────────────────────────────────────────────────
export function Notice({ type, children }) {
  const icons = { info: 'info-circle', warn: 'alert-triangle', success: 'circle-check' };
  return (
    <div className={`notice notice-${type}`}>
      <i className={`ti ti-${icons[type]}`} />
      <span>{children}</span>
    </div>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────
export function FormGroup({ label, children, span }) {
  return (
    <div className={`form-group${span ? ' span-' + span : ''}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type, disabled, style }) {
  return (
    <input
      className="form-input"
      type={type || 'text'}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
    />
  );
}

export function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <select className="form-input" value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value !== undefined ? o.value : o} value={o.value !== undefined ? o.value : o}>
          {o.label !== undefined ? o.label : o}
        </option>
      ))}
    </select>
  );
}
