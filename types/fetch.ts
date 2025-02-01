export type FetchTypeList<T> = { 
    data: T[], 
    error: Error | undefined 
}

export type FetchTypeSingle<T> = { 
    data: T | undefined, 
    error: Error | undefined 
}