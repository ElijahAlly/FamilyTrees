import { resolve } from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function scanComponents(dir: string): Promise<string[]> {
    try {
        const components: string[] = []
        const files = await fs.readdir(resolve(__dirname, '..', dir))

        for (const file of files) {
            const fullPath = resolve(__dirname, '..', dir, file)
            const stat = await fs.stat(fullPath)

            if (stat.isDirectory()) {
                components.push(...await scanComponents(`${dir}/${file}`))
            } else if (file.endsWith('.vue')) {
                components.push(file.replace('.vue', ''))
                // Add auto-style class to component if needed
                await addAutoStyleToComponent(fullPath, file.replace('.vue', ''))
            }
        }

        return components
    } catch (error) {
        console.error(`Error scanning ${dir}:`, error)
        return []
    }
}

async function addAutoStyleToComponent(filepath: string, componentName: string) {
    try {
        const content = await fs.readFile(filepath, 'utf-8')
        const kebabCase = componentName
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase()
        const autoStyleClass = `${kebabCase}-as`

        // Skip if the component already has the auto-style class
        if (content.includes(autoStyleClass)) {
            return
        }

        // Check if the component has a script setup section
        const hasScriptSetup = content.includes('<script setup')
        const hasTemplate = content.includes('<template')

        let updatedContent = content

        if (!hasScriptSetup) {
            // Add script setup section if it doesn't exist
            const scriptSection = `<script setup lang="ts">
import type { AutoStyleClass } from '@/types/auto-styles';

const autoStyleClass: AutoStyleClass = '${autoStyleClass}';
</script>

${content}`
            updatedContent = scriptSection
        } else {
            // Add import and constant to existing script setup
            const importStatement = `import type { AutoStyleClass } from '@/types/auto-styles';`
            const constStatement = `\nconst autoStyleClass: AutoStyleClass = '${autoStyleClass}';`

            // Insert after script setup opening tag
            updatedContent = content.replace(
                /<script setup.*?>/,
                `$&\n${importStatement}${constStatement}`
            )
        }

        if (hasTemplate) {
            // Update the root element in template to include :class="autoStyleClass"
            updatedContent = updatedContent.replace(
                /(<template>[\s\S]*?<[^>]+)>/,
                (match, p1) => {
                    if (match.includes(':class=') || match.includes('class=')) {
                        return match.replace(/class="([^"]*)"/, `class="$1" :class="autoStyleClass"`)
                    }
                    return `${p1} :class="autoStyleClass">`
                }
            )
        }

        await fs.writeFile(filepath, updatedContent, 'utf-8')
        console.log(`Added auto-style class to ${componentName}`)
    } catch (error) {
        console.error(`Error adding auto-style to ${componentName}:`, error)
    }
}

// Export the function directly
export async function generateAutoStyles() {
    try {
        const dirs = ['components', 'layouts', 'pages']
        const allComponents = []

        for (const dir of dirs) {
            const components = await scanComponents(dir)
            allComponents.push(...components)
        }

        const typeContent = `/**
 * Auto-generated types for auto-style system
 * DO NOT EDIT DIRECTLY
 */

/**
 * Valid component names for auto-style system
 */
export type ValidComponentName =
${allComponents.map(name => `    | '${name}'`).join('\n')};

/**
 * Valid auto-style class names
 */
export type AutoStyleClass =
${allComponents.map(name => {
            const kebabCase = name
                .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                .toLowerCase()
            return `    | '${kebabCase}-as'`
        }).join('\n')};
`

        await fs.writeFile(
            resolve(__dirname, '..', 'types', 'auto-styles.ts'),
            typeContent
        )

        console.log('Auto-styles types generated successfully')
    } catch (error) {
        console.error('Error generating auto-styles:', error)
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generateAutoStyles()
}