interface LoadingFallbackProps {
    message?: string
}

export function LoadingFallback({ message = "Cargando..." }: LoadingFallbackProps) {
    return (
        <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
        </div>
    )
}
