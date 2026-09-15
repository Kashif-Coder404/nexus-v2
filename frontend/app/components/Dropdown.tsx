"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, RotateCcw } from "lucide-react";

export interface DropdownProps {
  title: string;
  itemNum?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void | Promise<void>;
  onAdd?: () => void;
  viewAllHref?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  classname: {
    mainCont?: string;
    addButton?: string;
  };
}

export function DropdownItem({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 rounded-lg bg-brand-surface/40 border border-brand-border/20 hover:bg-brand-surface/80 hover:border-brand-border/50 transition text-sm cursor-pointer text-white flex justify-between items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownViewAll({
  href,
  onClick,
  label = "View all",
}: {
  href?: string;
  onClick?: () => void;
  label?: string;
}) {
  const content = (
    <>
      <span>{label}</span>
      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </>
  );

  return (
    <div className="flex justify-end pt-1 px-1">
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-brand-hover hover:text-white transition group cursor-pointer"
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1 text-xs text-brand-hover hover:text-white transition group cursor-pointer"
        >
          {content}
        </button>
      )}
    </div>
  );
}

export default function Dropdown({
  title,
  icon,
  itemNum,
  children,
  defaultOpen = false,
  isLoading = false,
  onRefresh,
  onAdd,
  viewAllHref,
  onViewAll,
  viewAllLabel = "View all",
  showViewAll,
  classname = {
    mainCont: "",
    addButton: `font-bold text-lg cursor-pointer border border-brand-border/50 text-brand-hover px-2 hover:bg-brand/30 hover:border-brand-hover hover:scale-110 transition-all rounded`,
  },
}: DropdownProps & { showViewAll?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSpinning = isLoading || isRefreshing;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const hasViewAll = Boolean(viewAllHref || onViewAll || showViewAll);

  return (
    <div className={[style.container, classname.mainCont].join(" ")}>
      {/* Top Header Row */}
      <div className={style.headerRow}>
        <div className={style.titleWrapper}>
          {icon}
          <span className={style.titleText}>{title}</span>
          {itemNum !== undefined && (
            <span className={style.itemNum}>{itemNum}</span>
          )}
          <button
            type="button"
            className={style.toggleBtn}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={`Toggle ${title}`}
          >
            <ChevronDown
              strokeWidth={3}
              className={`${style.chevronIcon} ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className={style.actionsWrapper}>
          {onRefresh && (
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleRefresh}
              className={style.refreshBtn}
              aria-label={`Refresh ${title}`}
            >
              <RotateCcw
                strokeWidth={3}
                className={`${style.refreshIcon} ${
                  isSpinning ? style.refreshSpin : style.refreshSpinStopped
                }`}
              />
            </button>
          )}

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className={classname?.addButton || style.addBtn}
              aria-label={`Add ${title}`}
            >
              <Plus />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Dropdown List */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className={style.listContainer}>
            {children}
            {hasViewAll && (
              <DropdownViewAll
                href={viewAllHref}
                onClick={onViewAll}
                label={viewAllLabel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const style = {
  container: "",
  itemNum:
    "flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-surface border border-brand-border/60 text-brand-hover shadow-sm shadow-brand/30 tracking-tight",
  headerRow: "flex ml-1 justify-between items-center text-center text-white",
  titleWrapper: "flex items-center gap-2",
  titleText: "text-base sm:text-lg font-bold",
  toggleBtn: "text-zinc-300 hover:text-white transition cursor-pointer p-0.5",
  chevronIcon: "w-4 h-4 duration-300",
  actionsWrapper: "flex flex-row items-center gap-3",
  refreshBtn:
    "text-white p-2 rounded-full cursor-pointer hover:bg-white/10 transition",
  refreshIcon: "w-4 h-4",
  refreshSpin:
    "animate-[spin_1s_linear_infinite_reverse] transform duration-200 scale-150",
  refreshSpinStopped: "transform duration-200 scale-100",
  addBtn:
    "p-1.5 rounded-lg cursor-pointer text-brand-hover hover:text-white bg-brand-surface/40 hover:bg-brand/20 border border-brand-border/40 hover:border-brand-border/80 transition-all flex items-center justify-center shadow-xs shadow-brand/20",
  addIcon: "w-4 h-4",
  listContainer: "flex flex-col gap-1 mt-2 w-full",
};
