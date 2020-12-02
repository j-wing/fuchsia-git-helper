/// <reference path="git.d.ts" />

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { allowedNodeEnvironmentFlags } from 'process';
import * as vscode from 'vscode';
import { Commit, GitExtension } from "./git.d";

const GITILES_BASE = "https://fuchsia.googlesource.com/fuchsia/+/";
const GITILES_MASTER = "refs/heads/master";

const OSSCS_BASE = "https://cs.opensource.google/fuchsia/fuchsia/+/master:";

const CONFIG_ROOT = "fuchsia-git-helper";
const FUCHSIA_ROOT_SETTING = "fuchsiaRoot";
const VIEWER_SETTING = "codeViewer";
const OSSCS = "osscs";
const GITILES = "gitiles";

// The object received when the extension is called from context-menu / right click
type ContextMenuCommandArg = {
	path: string,
};

// When the extension is called from context menu, we get a PathObj argument. When it is called
// from the command palette, we get an unedfined argument
type CommandArg = ContextMenuCommandArg | undefined;

function printFuchsiaRootError() {
	console.error("couldn't find fuchsia root! try setting the", CONFIG_ROOT + "." + FUCHSIA_ROOT_SETTING, "setting.");
}

function makeGitilesUrl(path: string, hash: string | null, line: string | null): vscode.Uri {
	if (hash === null) {
		hash = GITILES_MASTER;
	}

	let uri = vscode.Uri.parse(GITILES_BASE + hash + path);
	if (line !== null) {
		uri = uri.with({fragment: line});
	}
	return uri;
}
function makeOssCsUrl(path: string, hash: string | null, line: string | null): vscode.Uri {
	let url = OSSCS_BASE + path;
	if (line !== null) {
		url += ";l=" + line;
	}
	if (hash !== null) {
		url += ";drc=" + hash;
	}
	return vscode.Uri.parse(url);
}

function makeUrl(path: string, hash: string | null, line: string | null): vscode.Uri {
	let viewer: string | null | undefined = vscode.workspace.getConfiguration(CONFIG_ROOT).get(VIEWER_SETTING);
	
	if (viewer == GITILES) {
		return makeGitilesUrl(path, hash, line);
	} else {
		return makeOssCsUrl(path, hash, line);
	}
}

function getRoot(): vscode.Uri | undefined {
	let root: string | null | undefined = vscode.workspace.getConfiguration(CONFIG_ROOT).get(FUCHSIA_ROOT_SETTING);
	if (root) {
		return vscode.Uri.parse(root);
	}

	if (vscode.workspace.workspaceFolders !== undefined) {
		// Try to find a top-level directory named "fuchsia"
		for (let dir of vscode.workspace.workspaceFolders) {
			if (dir.name == "fuchsia") {
				return dir.uri;
			}
		}
	}
	printFuchsiaRootError();
}

function getPathSegment(arg: CommandArg) {
	let root = getRoot()?.fsPath;

	let fullPath =
		arg?.path || // Try to use the passed in path, if available
		vscode.window.activeTextEditor?.document.fileName || // Fallback to the active editor's path
		root || // Fallback to the root of the workspace
		'';

	return fullPath.slice(root?.length);
}

function getLineSegment(): string | null {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		let line = (activeEditor.selection.active.line + 1);
		return line.toString();
	}
	return null;
}

function openAtRevision(arg: CommandArg, includeLineNumber: boolean) {
	let cutPath = getPathSegment(arg);
	let line: string | null = null;
	if (includeLineNumber) {
		line = getLineSegment();
	}

	const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
	if (gitExtension === undefined) {
		vscode.commands.executeCommand('vscode.open', makeUrl(cutPath, null, line));
		return;
	}
	const git = gitExtension.getAPI(1);
	let root = getRoot();
	if (root !== undefined) {
		let repo = git.getRepository(root);
		if (repo) {
			repo.log().then((commits: Commit[]) => {
				let latest = commits[0];
				vscode.commands.executeCommand('vscode.open', makeUrl(cutPath, latest.hash, line));
			});
		} else {
			console.warn("could not open repo! using master instead.");
			vscode.commands.executeCommand('vscode.open', makeUrl(cutPath, null, line));
		}
	} else {
		printFuchsiaRootError();
	}
}

function openAtMaster(arg: CommandArg, includeLineNumber: boolean) {
	let cutPath = getPathSegment(arg);
	let line: string | null = null;
	if (includeLineNumber) {
		line = getLineSegment();
	}
	vscode.commands.executeCommand('vscode.open', makeUrl(cutPath, null, line));
}

export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionGitiles', (arg) => {
		openAtRevision(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionFromExplorerGitiles', (arg) => {
		openAtRevision(arg, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterGitiles', (arg) => {
		openAtMaster(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterFromExplorerGitiles', (arg) => {
		openAtMaster(arg, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionOsscs', (arg) => {
		openAtRevision(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtRevisionFromExplorerOsscs', (arg) => {
		openAtRevision(arg, false);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterOsscs', (arg) => {
		openAtMaster(arg, true);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('fuchsia-git-helper.openAtMasterFromExplorerOsscs', (arg) => {
		openAtMaster(arg, false);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
