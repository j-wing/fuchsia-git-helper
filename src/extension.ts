/// <reference path="git.d.ts" />

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Commit, GitExtension } from "./git.d";


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
		let line = (activeEditor.selection.active.line + 1);
		return "#" + line;
	}
	return "";
}

function openAtRevision(pathObj: any, includeLineNumber: boolean) {
	let cutPath = getPathSegment(pathObj);
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

function openAtMaster(pathObj: any, includeLineNumber: boolean) {
	let cutPath = getPathSegment(pathObj);
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
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevision', (pathObj) => {
		openAtRevision(pathObj, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionFromExplorer', (pathObj) => {
		openAtRevision(pathObj, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMaster', (pathObj) => {
		openAtMaster(pathObj, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterFromExplorer', (pathObj) => {
		openAtMaster(pathObj, false);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
