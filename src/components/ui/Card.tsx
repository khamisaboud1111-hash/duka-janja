import React from "react";
import Link from "next/link";

// ===============================
// Types
// ===============================
export interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

// ===============================
// Card Component
// ===============================
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-slate-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-900
        shadow-sm
        hover:shadow-lg
        transition-all
        duration-300
        p-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ===============================
// Quick Action Grid
// ===============================
export function QuickActionGrid({
  actions,
  light = false,
}: {
  actions: QuickAction[];
  light?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {actions.map((action) => {
        const classes = `
          group
          relative
          flex
          flex-col
          items-center
          justify-center
          rounded-xl
          p-3
          min-h-[100px]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-lg
          active:scale-95
          ${
            light
              ? "quick-action-tile"
              : "icon-tile bg-white dark:bg-slate-900"
          }
          ${
            action.disabled
              ? "opacity-50 pointer-events-none cursor-not-allowed"
              : ""
          }
        `;

        const content = (
          <>
            {/* Badge */}
            {action.badge && (
              <span className="absolute top-2 right-2 rounded-full bg-red-500 text-white text-[10px] px-2 py-0.5">
                {action.badge}
              </span>
            )}

            {/* Icon */}
            <span
              className={`
                ${
                  light
                    ? "quick-action-tile-icon"
                    : "icon-tile-icon"
                }
                transition-transform
                duration-300
                group-hover:scale-110
              `}
            >
              {action.icon}
            </span>

            {/* Label */}
            <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
              {action.label}
            </span>

            {/* Subtitle */}
            {action.subtitle && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">
                {action.subtitle}
              </span>
            )}
          </>
        );

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              aria-label={action.label}
              title={action.label}
              className={classes}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
            title={action.label}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

// ===============================
// Skeleton Loader
// ===============================
export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`
        animate-pulse
        rounded-xl
        bg-slate-200
        dark:bg-slate-700
        ${className}
      `}
    />
  );
}
