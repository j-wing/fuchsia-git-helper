/// <reference path="git.d.ts" />

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commit, GitExtension } from "./git.d";

const BASE = "https://fuchsia.googlesource.com/fuchsia/+/";
const MASTER = "refs/heads/master";

// The object received when the extension is called from context-menu / right click
type ContextMenuCommandArg = {
	path: string,
};

// When the extension is called from context menu, we get a PathObj argument. When it is called
// from the command palette, we get an unedfined argument
type CommandArg = ContextMenuCommandArg | undefined;

function getPathSegment(arg: CommandArg) {
	debugger;
	let root = vscode.workspace.rootPath;

	let fullPath =
		arg?.path || // Try to use the passed in path, if available
		vscode.window.activeTextEditor?.document.fileName || // Fallback to the active editor's path
		root || // Fallback to the root of the workspace
		'';

	return fullPath.slice(root?.length);
}

function getLineSegment() {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		let line = (activeEditor.selection.active.line + 1);
		return "#" + line;
	}
	return "";
}

function openAtRevision(arg: CommandArg, includeLineNumber: boolean) {
	let cutPath = getPathSegment(arg);
	let line = "";
	if (includeLineNumber) {
		line = getLineSegment();
	}

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
}

function openAtMaster(arg: CommandArg, includeLineNumber: boolean) {
	let cutPath = getPathSegment(arg);
	let line = "";
	if (includeLineNumber) {
		line = getLineSegment();
	}
	vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(BASE + MASTER + cutPath + line));
}

export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevision', (arg) => {
		openAtRevision(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionFromExplorer', (arg) => {
		openAtRevision(arg, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMaster', (arg) => {
		openAtMaster(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterFromExplorer', (arg) => {
		openAtMaster(arg, false);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
