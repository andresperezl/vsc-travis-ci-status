import {window, commands, workspace} from 'vscode';
import TravisStatusIndicator from './travis-status';

var indicator, proxySetup, proxyData;

export function activate() { 
	// Create File System Watcher
	let watcher = workspace.createFileSystemWatcher('.travis.yml', false, false, true);
	watcher.onDidChange((e) => updateStatus());
	watcher.onDidCreate((e) => updateStatus());
	
	// Register Commands
	commands.registerCommand('extension.updateTravis', () => updateStatus());
	commands.registerCommand('extension.openInTravis', () => openInTravis());
	
	// Check if file already present
	workspace.findFiles('.travis.yml', '', 1).then((result) => {
		if (result && result.length > 0) {
			updateStatus();
		}
	});
}

// Helper Function
function updateStatus() {
	if (!proxySetup) setupProxy();
	indicator = indicator || new TravisStatusIndicator();
	indicator.updateStatus();
}

function openInTravis() {
	if (!proxySetup) setupProxy();
	indicator = indicator || new TravisStatusIndicator();
	indicator.openInTravis();
}

function setupProxy() {
	if (process.env && process.env.http_proxy) {
		// Seems like we have a proxy
		let match = process.env.http_proxy.match(/^(http:\/\/)?([^:\/]+)(:([0-9]+))?/i);
		let proxyData = { host: null, port: null };
		
		if (match && match.length >= 3) {
			proxyData.host = match[2];
			proxyData.port = match[4] != null ? match[4] : 80;
		}
		
		if (proxyData.host && proxyData.port) {
			var globalTunnel = require('global-tunnel');

			globalTunnel.initialize({
				host: proxyData.host,
				port: proxyData.port
			});	
		} else {
			// We have trouble getting ifnormation form the global http_proxy env variable
			window.showErrorMessage('Travis CI: HTTP Proxy settings detected, but we have trouble parsing the setting. The extension may not work properly.');
		}
	}
	
	proxySetup = true;
}