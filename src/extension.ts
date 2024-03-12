import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    const language = "vex";
    const extensionId = "houdiniVEX";
    const settingId = "helpDocumentation";
    const config = vscode.workspace.getConfiguration(extensionId).get<string>(settingId)!;
    const extensionPath = context.extensionPath;
    const keywordsFilePath = path.join(extensionPath, "/completions/keywords.txt");
    const keywords = fs.readFileSync(keywordsFilePath, "utf-8").split("\n");
    const functionsFilePath = path.join(extensionPath, "/completions/functions.txt");
    const functions = fs.readFileSync(functionsFilePath, "utf-8").split("\n");
    let docsJson: any;
    readJSON(config, extensionPath).then(data => {
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
            keywords.forEach(item => {
                completionItems.push(new vscode.CompletionItem(item.trim(), vscode.CompletionItemKind.Keyword));
            });
            functions.forEach(item => {
                let [label, insertText] = item.trim().split("#");
                completionItems.push({
                    label: label,
                    insertText: new vscode.SnippetString(insertText),
                    kind: vscode.CompletionItemKind.Snippet,
                    sortText: "z"
                });
            });
            return completionItems;
        }
    });
    const configHandler = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration("houdiniVEX.helpDocumentation")) {
            const newValue = vscode.workspace.getConfiguration(extensionId).get<string>(settingId)!;
            readJSON(newValue, extensionPath).then(data => {
                docsJson = data;
            });
        }
    });
    context.subscriptions.push(hoverProvider, completionProvider, configHandler);
}

function readJSON(config: string, extensionPath: string) {
    return new Promise((resolve) => {
        let docsFileName = "docs_online.json";
        if (config === "Local") {
            docsFileName = "docs.json";
        }
        const filePath = path.join(extensionPath, `/docs/${docsFileName}`);
        fs.readFile(filePath, "utf8", (err, data) => {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
        });
    });
}