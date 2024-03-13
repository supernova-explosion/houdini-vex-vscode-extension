import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const language = "vex";
    const extensionId = "houdiniVEX";
    const settingId = "helpDocumentation";
    const keywordsFilePath = "/completions/keywords.txt";
    const functionsFilePath = "/completions/functions.txt";
    const config = vscode.workspace.getConfiguration(extensionId).get<string>(settingId)!;
    const extensionUri = context.extensionUri;
    const keywords = readFile(keywordsFilePath, extensionUri).then(data => data!.split("\n"));
    const functions = readFile(functionsFilePath, extensionUri).then(data => data!.split("\n"));
    let docsJson: any;
    readJSON(config, extensionUri).then(data => {
        docsJson = data;
    });
    const hoverProvider = vscode.languages.registerHoverProvider(language, {
        provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            const word = document.getText(wordRange);
            var nextChar = " ";
            var offset = 0;
            var maxOffset = 50;
            while (nextChar === " ") {
                nextChar = document.getText(new vscode.Range(position.line, wordRange.end.character + offset, position.line, wordRange.end.character + offset + 1));
                offset++;
                if (offset > maxOffset) {
                    break;
                }
            }
            if (nextChar === "(") {
                if (word && word in docsJson) {
                    const content = new vscode.MarkdownString(docsJson[word]);
                    content.supportHtml = true;
                    return new vscode.Hover(content);
                }
            }
        }
    });
    const completionProvider = vscode.languages.registerCompletionItemProvider(language, {
        provideCompletionItems(document, position, token, context) {
            const completionItems: vscode.CompletionItem[] = [];
            const seenVariables = new Set();
            const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
            const regex = /\s+(\w+)\s*(?:=.*)?;/g;
            let match;
            while ((match = regex.exec(textBeforeCursor)) !== null) {
                const variableName = match[1];
                if (!seenVariables.has(variableName)) {
                    const completionItem = new vscode.CompletionItem(variableName, vscode.CompletionItemKind.Variable);
                    completionItems.push(completionItem);
                    seenVariables.add(variableName);
                }
            }
            keywords.then(data => data.forEach(item => {
                completionItems.push(new vscode.CompletionItem(item.trim(), vscode.CompletionItemKind.Keyword));
            }));
            functions.then(data => data.forEach(item => {
                let [label, insertText] = item.trim().split("#");
                completionItems.push({
                    label: label,
                    insertText: new vscode.SnippetString(insertText),
                    kind: vscode.CompletionItemKind.Snippet,
                    sortText: "z"
                });
            }));
            return completionItems;
        }
    });
    const configHandler = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("houdiniVEX.helpDocumentation")) {
            const newValue = vscode.workspace.getConfiguration(extensionId).get<string>(settingId)!;
            readJSON(newValue, extensionUri).then(data => {
                docsJson = data;
            });
        }
    });
    context.subscriptions.push(hoverProvider, completionProvider, configHandler);
}

function readJSON(config: string, extensionUri: vscode.Uri) {
    return new Promise((resolve) => {
        let docsFileName = "docs_online.json";
        if (config === "Local") {
            docsFileName = "docs.json";
        }
        const filePath = `/docs/${docsFileName}`;
        readFile(filePath, extensionUri).then(data => {
            const jsonData = JSON.parse(data!);
            resolve(jsonData);
        });
    });
}

async function readFile(path: string, extensionUri: vscode.Uri): Promise<string | undefined> {
    try {
        const uri = vscode.Uri.joinPath(extensionUri, path);
        const data = await vscode.workspace.fs.readFile(uri);
        const decoder = new TextDecoder();
        return decoder.decode(data);
    } catch (error) {
        console.error('Failed to read file:', error);
        return undefined;
    }
}