#!/usr/bin/env node
// @ts-check

/**
 * Chat Debug CLI
 *
 * A command-line tool for debugging the chat app's message structure.
 * Uses Chrome DevTools Protocol to inspect browser state.
 *
 * Usage:
 *   node scripts/debug-chat.cjs <command>
 *
 * Commands:
 *   console     - Get recent console logs (filtered for ChatBubble)
 *   messages    - Get current messages state
 *   parts       - Get message parts structure
 *   help        - Show help message
 *
 * Prerequisites:
 *   Run Chrome/Chromium with: --remote-debugging-port=9222
 *   Or use: chrome://inspect in Chrome DevTools
 */

const http = require('http');
const WebSocket = require('ws');

const CDP_PORT = 9222;

class ChatDebugCLI {
  constructor() {
    this.port = CDP_PORT;
  }

  async getTargets() {
    return new Promise((resolve, reject) => {
      http
        .get(`http://localhost:${this.port}/json`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        })
        .on('error', (err) => {
          reject(new Error(`Cannot connect to Chrome DevTools on port ${this.port}. Make sure Chrome is running with --remote-debugging-port=${this.port}`));
        });
    });
  }

  async getMainWindow() {
    const targets = await this.getTargets();
    // Find the page that's likely our app (localhost:5173 for Vite)
    const mainWindow = targets.find(
      (t) => t.type === 'page' && (
        t.url.includes('localhost:5173') ||
        t.url.includes('localhost:3000') ||
        t.url.includes('127.0.0.1:5173')
      )
    );

    if (!mainWindow) {
      console.log('Available targets:');
      targets.forEach(t => console.log(`  - ${t.type}: ${t.url}`));
      throw new Error('Main window not found. Make sure the app is open in Chrome.');
    }

    return mainWindow;
  }

  async executeInTarget(target, expression) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(target.webSocketDebuggerUrl);

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            id: 1,
            method: 'Runtime.evaluate',
            params: {
              expression,
              returnByValue: true,
              awaitPromise: true,
            },
          })
        );
      });

      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.id === 1) {
          ws.close();
          if (response.error) {
            reject(new Error(response.error.message));
          } else if (response.result.exceptionDetails) {
            reject(new Error(response.result.exceptionDetails.text || 'Execution failed'));
          } else {
            resolve(response.result.result.value);
          }
        }
      });

      ws.on('error', reject);
    });
  }

  async getConsole(filter = 'ChatBubble') {
    try {
      const mainWindow = await this.getMainWindow();

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(mainWindow.webSocketDebuggerUrl);
        const logs = [];
        let nextId = 1000;
        const pending = new Map();

        const SAFE_STRINGIFY_FN = `
          function() {
            try {
              const seen = new WeakSet();
              return JSON.stringify(this, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                  if (seen.has(value)) return '[Circular]';
                  seen.add(value);
                }
                return value;
              }, 2);
            } catch (e) {
              try { return String(this); } catch (e2) { return '[Object]'; }
            }
          }
        `;

        const serializeArg = (arg) => {
          if (arg.type === 'string') return Promise.resolve(arg.value);
          if (arg.type === 'undefined') return Promise.resolve('undefined');
          if (arg.type === 'number' || arg.type === 'boolean')
            return Promise.resolve(String(arg.value));
          if (arg.type === 'symbol') return Promise.resolve(arg.description || 'Symbol()');
          if (arg.subtype === 'null') return Promise.resolve('null');
          if (arg.objectId) {
            const id = nextId++;
            ws.send(
              JSON.stringify({
                id,
                method: 'Runtime.callFunctionOn',
                params: {
                  objectId: arg.objectId,
                  functionDeclaration: SAFE_STRINGIFY_FN,
                  returnByValue: true,
                },
              })
            );
            return new Promise((res) => pending.set(id, res));
          }
          if (arg.description) return Promise.resolve(arg.description);
          return Promise.resolve('[Object]');
        };

        ws.on('open', () => {
          ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
          ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

          console.log(`Listening for console logs (filter: ${filter || 'none'})...`);
          console.log('Press Ctrl+C to stop\n');

          // Don't auto-close, listen continuously
        });

        ws.on('message', async (data) => {
          const msg = JSON.parse(data.toString());

          if (msg.id && pending.has(msg.id)) {
            const resolver = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.result && msg.result.result) {
              const r = msg.result.result;
              resolver((r.value !== undefined ? r.value : r.description) ?? '[Object]');
            } else {
              resolver('[Object]');
            }
            return;
          }

          if (msg.method === 'Runtime.consoleAPICalled') {
            const { type, args, timestamp } = msg.params;
            try {
              const parts = await Promise.all(args.map(serializeArg));
              const text = parts.join(' ');

              // Apply filter
              if (!filter || text.includes(filter)) {
                const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
                console.log(`[${time}] [${type.toUpperCase()}]`);
                console.log(text);
                console.log('---');
              }
            } catch (e) {
              // Ignore serialization errors
            }
          }
        });

        ws.on('error', (error) => {
          reject({ success: false, error: error.message });
        });

        ws.on('close', () => {
          resolve({ success: true });
        });

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          console.log('\nStopping...');
          ws.close();
          process.exit(0);
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMessages() {
    try {
      const mainWindow = await this.getMainWindow();

      const result = await this.executeInTarget(
        mainWindow,
        `
        (() => {
          // Try to find React fiber and extract messages state
          const rootEl = document.getElementById('root');
          if (!rootEl) return { error: 'Root element not found' };

          // Get React internal instance
          const key = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
          if (!key) return { error: 'React fiber not found' };

          // Search for messages in component state
          let fiber = rootEl[key];
          const messages = [];

          const searchFiber = (node, depth = 0) => {
            if (!node || depth > 50) return;

            // Check memoizedState for messages
            if (node.memoizedState) {
              let state = node.memoizedState;
              while (state) {
                if (state.memoizedState && Array.isArray(state.memoizedState)) {
                  const arr = state.memoizedState;
                  if (arr.length > 0 && arr[0]?.role) {
                    return arr; // Found messages array
                  }
                }
                state = state.next;
              }
            }

            // Search children
            const childResult = searchFiber(node.child, depth + 1);
            if (childResult) return childResult;

            // Search siblings
            return searchFiber(node.sibling, depth + 1);
          };

          const foundMessages = searchFiber(fiber);

          if (foundMessages) {
            return {
              count: foundMessages.length,
              messages: foundMessages.map(m => ({
                id: m.id,
                role: m.role,
                contentPreview: m.content?.slice(0, 100),
                hasContent: !!m.content,
                hasParts: !!m.parts,
                partsCount: m.parts?.length || 0,
                partsTypes: m.parts?.map(p => p.type),
                hasToolInvocations: !!m.toolInvocations,
                toolInvocationsCount: m.toolInvocations?.length || 0,
                toolNames: m.toolInvocations?.map(t => t.toolName)
              }))
            };
          }

          return { error: 'Messages not found in React state' };
        })()
        `
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMessageParts() {
    try {
      const mainWindow = await this.getMainWindow();

      const result = await this.executeInTarget(
        mainWindow,
        `
        (() => {
          const rootEl = document.getElementById('root');
          if (!rootEl) return { error: 'Root element not found' };

          const key = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
          if (!key) return { error: 'React fiber not found' };

          let fiber = rootEl[key];

          const searchFiber = (node, depth = 0) => {
            if (!node || depth > 50) return;

            if (node.memoizedState) {
              let state = node.memoizedState;
              while (state) {
                if (state.memoizedState && Array.isArray(state.memoizedState)) {
                  const arr = state.memoizedState;
                  if (arr.length > 0 && arr[0]?.role) {
                    return arr;
                  }
                }
                state = state.next;
              }
            }

            const childResult = searchFiber(node.child, depth + 1);
            if (childResult) return childResult;
            return searchFiber(node.sibling, depth + 1);
          };

          const messages = searchFiber(fiber);

          if (!messages) return { error: 'Messages not found' };

          // Get detailed parts info for assistant messages
          const assistantMessages = messages.filter(m => m.role === 'assistant');

          return {
            totalMessages: messages.length,
            assistantMessages: assistantMessages.map(m => ({
              id: m.id,
              content: m.content,
              parts: m.parts?.map(p => {
                if (p.type === 'text') {
                  return { type: 'text', textPreview: p.text?.slice(0, 50) + (p.text?.length > 50 ? '...' : '') };
                } else if (p.type === 'tool-call') {
                  return { type: 'tool-call', toolName: p.toolName, hasArgs: !!p.args };
                } else if (p.type === 'tool-result') {
                  return { type: 'tool-result', toolName: p.toolName, hasResult: p.result !== undefined };
                }
                return { type: p.type };
              }),
              toolInvocations: m.toolInvocations?.map(t => ({
                toolName: t.toolName,
                state: t.state,
                hasResult: t.result !== undefined
              }))
            }))
          };
        })()
        `
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  showHelp() {
    console.log(`
Chat Debug CLI

Usage: node scripts/debug-chat.cjs <command> [options]

Commands:
  console [filter]    Listen to console logs (default filter: ChatBubble)
  messages            Get current messages state summary
  parts               Get detailed message parts structure
  help                Show this help message

Prerequisites:
  1. Run Chrome with remote debugging:
     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222

  2. Or open chrome://inspect in Chrome and enable "Discover network targets"

Examples:
  node scripts/debug-chat.cjs console
  node scripts/debug-chat.cjs console "Rendering tool"
  node scripts/debug-chat.cjs messages
  node scripts/debug-chat.cjs parts
`);
  }
}

async function main() {
  const cli = new ChatDebugCLI();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  let result;

  switch (command) {
    case 'console':
      result = await cli.getConsole(args[0] || 'ChatBubble');
      break;

    case 'messages':
      result = await cli.getMessages();
      break;

    case 'parts':
      result = await cli.getMessageParts();
      break;

    case 'help':
    default:
      cli.showHelp();
      process.exit(0);
  }

  if (result) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
