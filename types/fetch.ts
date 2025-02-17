export type FetchTypeList<T> = { 
    data: T[], 
    error: Error | undefined | null
}

export type FetchTypeSingle<T> = { 
    data: T | undefined | null, 
    error: Error | undefined | null
}

export type PostType = {
    success: boolean,
    error?: string,
    message?: string,
    data?: any
}