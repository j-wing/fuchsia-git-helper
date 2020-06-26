/// <reference path="git.d.ts" />

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Commit, GitExtension} from "./git.d";


const BASE = "https://fuchsia.googlesource.com/fuchsia/+/";
const MASTER = "refs/heads/master"
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getPathSegment(pathObj: any) {
	let path = pathObj.path;
	let root = vscode.workspace.rootPath;

	return path.slice(root?.length);
}

function getLineSegment() {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		return "#" + activeEditor.selection.active.line;
	}
	return "";
}

export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('fuchsia-git-helper.openAtRevision', (pathObj) => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello testetsts from fuchsia_git_helper!');
		let cutPath = getPathSegment(pathObj);
		let line = getLineSegment();

		const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
		if (gitExtension === undefined) {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(BASE + MASTER + cutPath + line));
			return;
		}
		const git = gitExtension.getAPI(1);
		git.repositories[0].log().then((commits: Commit[]) => {
			let latest = commits[0];
			vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(BASE + latest.hash + cutPath + line));
		});
	});
	let disposable2 = vscode.commands.registerCommand('fuchsia-git-helper.openAtMaster', (pathObj) => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello testetsts from fuchsia_git_helper!');
		let cutPath = getPathSegment(pathObj);
		let line = getLineSegment();
		vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(BASE + MASTER + cutPath + line));
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() { }
