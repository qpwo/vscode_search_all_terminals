const vscode = require('vscode');

let lastRegex = '';

async function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('search-all-terminals.search', async () => {
        const regexString = await vscode.window.showInputBox({
            prompt: 'Enter regex to search in all terminals',
            value: lastRegex,
        });

        if (!regexString) return;
        lastRegex = regexString;

        let regex;
        try {
            regex = new RegExp(regexString, 'g');
        } catch (e) {
            vscode.window.showErrorMessage(`Invalid regex: ${e.message}`);
            return;
        }

        const terminals = vscode.window.terminals;
        if (terminals.length === 0) {
            vscode.window.showInformationMessage('No open terminals.');
            return;
        }

        const originalClipboard = await vscode.env.clipboard.readText();
        const activeEditor = vscode.window.activeTextEditor;
        let searchResults = [];

        try {
            for (const [index, terminal] of terminals.entries()) {
                await terminal.show(true);
                await vscode.commands.executeCommand('workbench.action.terminal.selectAll');
                await new Promise(r => setTimeout(r, 100));
                await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
                const content = await vscode.env.clipboard.readText();

                const terminalId = `term${index + 1}_${terminal.name}`;
                for (const line of content.split(/\r?\n/)) {
                    if (regex.test(line)) {
                        searchResults.push(`${terminalId}: ${line}`);
                        regex.lastIndex = 0;
                    }
                }
            }
        } finally {
            await vscode.env.clipboard.writeText(originalClipboard);
            if (activeEditor) {
                await vscode.window.showTextDocument(activeEditor.document, { viewColumn: activeEditor.viewColumn, preserveFocus: true });
            } else {
                await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
            }
        }

        if (searchResults.length > 0) {
            const doc = await vscode.workspace.openTextDocument({ content: searchResults.join('\n') });
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: false });
        } else {
            vscode.window.showInformationMessage('No results found.');
        }
    }));
}

function deactivate() {}

module.exports = { activate, deactivate };
