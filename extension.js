const vscode = require('vscode')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

let lastRegex = ''

async function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('search-all-terminals.search', async () => {
        const regexString = await vscode.window.showInputBox({
            prompt: 'Enter regex to search in all terminals',
            value: lastRegex,
        })

        if (!regexString) return
        lastRegex = regexString

        let regex
        try {
            regex = new RegExp(regexString, 'g')
        } catch (e) {
            vscode.window.showErrorMessage(`Invalid regex: ${e.message}`)
            return
        }

        const terminals = vscode.window.terminals
        if (terminals.length === 0) {
            vscode.window.showInformationMessage('No open terminals.')
            return
        }

        const originalClipboard = await vscode.env.clipboard.readText()
        const initialTerminal = vscode.window.activeTerminal
        let searchResults = []

        try {
            for (const [index, terminal] of terminals.entries()) {
                await terminal.show(true)
                await vscode.commands.executeCommand('workbench.action.terminal.selectAll')
                await new Promise(r => setTimeout(r, 100))
                await vscode.commands.executeCommand('workbench.action.terminal.copySelection')
                const content = await vscode.env.clipboard.readText()

                const terminalId = `term${index + 1}_${terminal.name}`
                for (const line of content.split(/\r?\n/)) {
                    if (regex.test(line)) {
                        searchResults.push(`${terminalId}: ${line}`)
                        regex.lastIndex = 0
                    }
                }
            }
        } finally {
            await vscode.env.clipboard.writeText(originalClipboard)
        }

        if (searchResults.length > 0) {
            let i = 0
            let resultsPath
            while (true) {
                resultsPath = path.join(os.tmpdir(), `termsearchresults_${i}.log`)
                try {
                    await fs.stat(resultsPath)
                    i++
                } catch (e) {
                    if (e.code === 'ENOENT') break
                    vscode.window.showErrorMessage(`Error finding temp file path: ${e.message}`)
                    return
                }
            }
            try {
                await fs.writeFile(resultsPath, searchResults.join('\n'))
                const doc = await vscode.workspace.openTextDocument(resultsPath)
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Active, preview: false })
            } catch (e) {
                vscode.window.showErrorMessage(`Failed to write/open results file: ${e.message}`)
            }
        } else {
            vscode.window.showInformationMessage('No results found.')
        }

        if (initialTerminal) {
            initialTerminal.show()
        }
    }))
}

function deactivate() { }

module.exports = { activate, deactivate }
