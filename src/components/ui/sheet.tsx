import * as React from "react"
import { cn } from "@/utils/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ isOpen, onClose, title, children, className }: SheetProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sheet Content */}
      <div 
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background border-t rounded-t-xl shadow-lg transition-transform duration-300 ease-in-out h-[85vh]",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 h-8 w-8">
            <X className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )
}
