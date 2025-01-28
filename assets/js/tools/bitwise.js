import { dotnet } from '../../packs/tools/BitwiseSharp/dotnet.js';

const isBrowser = typeof window !== "undefined";
if (!isBrowser) throw new Error("Expected to be running in a browser");

const { setModuleImports, getAssemblyExports, getConfig, runMainAndExit } = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);
exports.Program.Init();

function evalInput(input) {
    return exports.Program.Evalate(input);
}

const terminal = document.getElementById('terminal');
let currentMode = 'sd';
let padding = 0;
const history = [];
let historyIndex = -1;

function padNumber(num, length) {
    return num.toString().padStart(length, '0');
}

function formatOutput(value) {
    const number = value.trim();
    let formattedValue = number;
    
    if (!currentMode) {
        return '[ERROR]: No mode set. Please set a mode using "sd", "sb", or "sh"';
    }

    let parsedValue;
    try {
        parsedValue = BigInt(number);
    } catch (e) {
        return value;
    }

    switch (currentMode) {
        case 'sd':
            formattedValue = parsedValue.toString(10);
            break;
        case 'sb':
            formattedValue = parsedValue.toString(2);
            break;
        case 'sh':
            formattedValue = parsedValue.toString(16).toUpperCase();
            break;
        default:
            return '[ERROR]: Invalid mode set. Use "sd", "sb", or "sh"';
    }

    if (padding > 0) {
        formattedValue = padNumber(formattedValue, padding);
    }
    return formattedValue;
}

function appendOutput(output) {
    const outputLine = document.createElement('div');
    outputLine.classList.add('output');
    const isError = output.startsWith('[ERROR]:');

    if (isError) {
        outputLine.classList.add('error');
        output = output.replace('[ERROR]:', '').trim();
        outputLine.innerHTML = `<span class="error-tag">[ERROR]:</span> ${output}`;
    } else {
        outputLine.innerHTML = output;
    }

    terminal.appendChild(outputLine);
    terminal.scrollTop = terminal.scrollHeight;
}

function createLine() {
    const line = document.createElement('div');
    line.classList.add('line');

    const prompt = document.createElement('span');
    prompt.classList.add('prompt');
    prompt.textContent = '>>> ';

    const textarea = document.createElement('textarea');
    textarea.classList.add('input');
    textarea.rows = 1;
    textarea.autofocus = true;
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';

    line.appendChild(prompt);
    line.appendChild(textarea);
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;

    textarea.focus();
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    });

    textarea.addEventListener('keydown', handleKeydown.bind(null, textarea));
}

function handleKeydown(textarea, e) {
    if (e.key === 'Enter' && e.shiftKey) e.preventDefault();

    if (e.key === 'Enter') {
        e.preventDefault();
        const value = textarea.value.trim();
        if (value) handleInput(value);
        textarea.disabled = true;
        createLine();
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            textarea.value = history[historyIndex];
        }
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
            historyIndex++;
            textarea.value = history[historyIndex];
        } else {
            historyIndex = history.length;
            textarea.value = '';
        }
    }
}

function handleInput(value) {
    if (history.length === 0 || history[history.length - 1] !== value) {
        history.push(value);
        historyIndex = history.length;
    }

    if (value === 'help') { handleHelp(); return; }

    if (value.startsWith('sd') || value.startsWith('sb') || value.startsWith('sh') || value.startsWith('sp')) {
        handleModeChange(value);
    } else {
        appendOutput(formatOutput(evalInput(value)));
    }
}

function handleModeChange(value) {
    const [command, arg] = value.split(' ');
    if (command === 'sd' || command === 'sb' || command === 'sh') {
        currentMode = command;
    } else if (command === 'sp') {
        padding = parseInt(arg, 10);
        if (isNaN(padding) || padding < 0) {
            appendOutput('[ERROR]: Invalid padding value');
        }
    }
}

function handleHelp() {
    const helpMessage = [
        "Type a bitwise operation (e.g., 5 & 3) or an arithmetic operation (e.g., 10 + 2) and press Enter to see the result.",
        "Define variables using: <code>let &lt;name&gt; = &lt;expression&gt;</code> (e.g., <code>let x = 5 &amp; 3</code>).",
        "  ",
        "Supported bitwise operations: ~, &, ^, |, <<, >>.",
        "Supported integer operations: +, -, *, /, %.",
        "  ",
        "Commands for formatting outputs:",
        "  <code>sb</code> - Switch output to binary.",
        "  <code>sh</code> - Switch output to hexadecimal.",
        "  <code>sd</code> - Switch output to decimal.",
        "  <code>sp &lt;number&gt;</code> - Set padding (e.g., <code>sp 8</code> for 8-character width).",
        "  ",
        "To view this help message again, type <code>help</code>.",
        "This tool is powered by .NET 8.0 WebAssembly and developed under the project <a href='https://github.com/Pdawg-bytes/BitwiseSharp' target='_blank'>BitwiseSharp</a>."
    ];

    helpMessage.forEach(line => appendOutput(line));
}

createLine();