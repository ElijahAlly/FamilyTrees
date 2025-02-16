import { autoStyleStore } from "../store/autoStyleStore";

// * Event handling functions
export const handleMouseOver = (e: Event) => {
    if (!autoStyleStore.getIsActive()) return
    const target = e.target as HTMLElement
    target.style.outline = '2px solid #a855f7'
};

export const handleMouseOut = (e: Event) => {
    if (!autoStyleStore.getIsActive()) return
    const target = e.target as HTMLElement
    target.style.outline = ''
};

export const handleClick = (e: Event) => {
    if (!autoStyleStore.getIsActive()) return
    e.preventDefault()
    return e.target as HTMLElement
    // TODO: Implement dragging functionality here
};