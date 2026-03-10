import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageToggle() {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 px-2.5 h-9 text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
            <Globe size={16} className="shrink-0" />
            <span className="text-xs font-semibold tracking-wide uppercase">ES</span>
        </Button>
    )
}
