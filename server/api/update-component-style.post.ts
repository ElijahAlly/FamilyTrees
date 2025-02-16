// * auto-style

import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

function updateClassInLine(line: string, newStyle: string, currentClasses: string, category: string, isUndo: boolean): string {
    const classMatch = line.match(/class=["']([^"']+)["']/)
    if (!classMatch) return line

    const existingClasses = classMatch[1].split(' ')

    if (isUndo) {
        // Only remove classes that start with the specific category
        const filteredClasses = existingClasses.filter(cls => !cls.startsWith(category));
        // Only add the old style back if it exists and isn't empty
        const updatedClasses = newStyle
            ? [...filteredClasses, newStyle]
            : filteredClasses;
        return line.replace(/class=["']([^"']+)["']/, `class="${updatedClasses.join(' ')}"`)
    } else {
        // Normal style update behavior
        const filteredClasses = existingClasses.filter(cls => !cls.startsWith(category))
        const updatedClasses = [...filteredClasses, newStyle].join(' ')
        return line.replace(/class=["']([^"']+)["']/, `class="${updatedClasses}"`)
    }
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { filePath, elementId, elementPath, newStyle, currentClasses, isUndo, category } = body
    // console.log('Update request:', { filePath, elementId, elementPath, newStyle, currentClasses, isUndo, category })

    try {
        const cleanPath = filePath.replace(/^.*?(?=components|pages|layouts)/, '')
        const absolutePath = resolve(process.cwd(), cleanPath)
        const content = await readFile(absolutePath, 'utf-8')

        // Split content into lines
        const lines = content.split('\n')
        let updatedContent = ''
        let foundElement = false
        let inTemplate = false

        // Parse the element path
        const pathParts = elementPath.split(' > ')
        const targetElement = pathParts[pathParts.length - 1]
        const [tagName] = targetElement.split(':nth-child(')

        // Track element depth to match the correct nth-child
        let currentDepth = 0
        let depthMap = new Map<string, number>()

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]

            // Track if we're in the template section
            if (line.includes('<template')) {
                inTemplate = true
            }

            if (inTemplate) {
                // Count opening tags before this line
                const openTags = line.match(/<[^/][^>]*>/g) || []
                // Count closing tags before this line
                const closeTags = line.match(/<\/[^>]+>/g) || []

                currentDepth += openTags.length - closeTags.length

                // Check if this line contains our target element
                if (!foundElement && line.toLowerCase().includes(`<${tagName.toLowerCase()}`)) {
                    const tagKey = tagName.toLowerCase()
                    depthMap.set(tagKey, (depthMap.get(tagKey) || 0) + 1)

                    // Get the nth occurrence from the path
                    const nthMatch = targetElement.match(/:nth-child\((\d+)\)/)
                    const targetNth = nthMatch ? parseInt(nthMatch[1]) : 1

                    if (depthMap.get(tagKey) === targetNth) {
                        foundElement = true
                        line = updateClassInLine(line, newStyle, currentClasses, category, isUndo)
                    }
                }
            }

            updatedContent += line + '\n'
        }

        if (!foundElement) {
            console.warn('Element not found in file')
            return {
                success: false,
                message: 'Element not found in file'
            }
        }

        // Remove extra newline at the end
        updatedContent = updatedContent.replace(/\n$/, '')

        // Write the updated content back to the file
        await writeFile(absolutePath, updatedContent, 'utf-8')

        return {
            success: true,
            message: isUndo ? 'Style successfully undone' : 'Style updated successfully'
        }
    } catch (error: any) {
        console.error('Error updating component:', error)
        return createError({
            statusCode: 500,
            message: `Failed to update component style: ${error.message}`
        })
    }
})