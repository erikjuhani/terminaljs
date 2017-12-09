/**
 * Refactor code
 * Rethink Renderable
 */
class Renderable {
  constructor() {
    this.drawLine = 0;
  }

  render() {
    let drawVar = 0;
    if (this.data.length > 27) {
      drawVar = this.data.length - 27; // max lines
    }
    console.log(this.drawLine);
    this.data.slice(this.drawLine).forEach((line, i) => {
      console.log(i, line);
      if (i < drawVar) return;
      const newline = document.createElement('p');

      this.prefix.forEach(char => {
        this.renderChar(newline, char);
      });

      line.forEach((element, j) => {
        newline.appendChild(element);
      });

      this.terminal.window.appendChild(newline);      
    });
  }

  renderChar(line, char) {
    const newchar = document.createElement('span');
    newchar.appendChild(document.createTextNode(char));
    line.appendChild(newchar);
  }
}

/**
 * Animator class 
 * TODO
 * takes in a json file
 * 
 */
class Animator extends Renderable {
  constructor(delay, prefix, data) {
    this.data = data;
  }
}

/**
 * Caret class
 */
class Caret { 
  constructor(promt) {
    this.promt = promt;
    this.input = this.promt.inputField;
  }

  setPos(pos) {
    if (pos >= 0 && pos < this.input.length) {
      this.pos = pos;
    } 
  }

  move(dir) {
    const newPos = this.pos + dir;
    if (newPos >= 0 && newPos < this.input.length) {
      this.pos += dir;
      this.promt.render();
    }
  }
}

const dummyData =  ['H', 'e', 'l', 'l', 'o', '\u00A0', 'S', 't', 'r', 'a', 'n', 'g', 'e', 'r'];

/**
 * Storage extends Renderable.
 * Keeps all the awesome stuff stored.
 */
class Storage extends Renderable {
  constructor(prefix, terminal) {
    super();
    this.data = [this.parseCharArray(dummyData)];
    this.prefix = prefix;
    this.terminal = terminal;
  }

  parseCharArray(charArray) {
    return charArray.map(char => {
      const element = document.createElement('span');
      const textNode = document.createTextNode(char);
      element.appendChild(textNode);
      return element;
    });
  }
}

/**
 * Promt class extends Renderable.
 * Does all the heavy lifting :).
 */
class Promt extends Renderable {
  constructor(terminal) {
    super();
    this.prefix = ['\u25B2', '\u00A0', '~', '\u00A0'];
    this.inputField = [this.createElement('\u00A0')];
    this.terminal = terminal;
    this.caret = new Caret(this);
    this.commands = {
      // command key : callback
      cd: () => { console.log('change directory'); },
      curl: () => { console.log('curl') },
      clear: () => {
        // Needs a proper way of handling this
        this.moveDrawLine(this.terminal.storage.data.length + 1);
        this.currentCommand = null;
       },
      git: (options) => { 
        console.log('git')
      },
    }
    this.currentCommand = null;
  }

  render() {
    if (document.getElementById('promt')) {
      const promt = document.getElementById('promt');
      promt.parentNode.removeChild(promt);
    }    
    const promtLine = document.createElement('p');
    promtLine.id = 'promt';
      this.prefix.forEach(char => {
        this.renderChar(promtLine, char);
      });

      this.inputField.forEach((element, i) => {
        promtLine.appendChild(element);

        if (element.classList.contains('caret')) {
          element.classList.remove('caret');
        }

        if (element.classList.contains('command')) {
          element.classList.remove('command');
        }
        
        if (this.currentCommand && i < this.currentCommand.length) {
          element.classList.add('command');
        }

        if (this.caret.pos === undefined || this.caret.pos === null) {
          this.caret.setPos(this.inputField.length - 1);
        }
      });

      this.inputField[this.caret.pos].classList.add('caret');
      this.terminal.window.appendChild(promtLine);
  }

  createElement(char) {
    const element = document.createElement('span');
    const textNode = document.createTextNode(char);
    element.appendChild(textNode);
    return element;
  }

  addStorage() {
    const promt = document.getElementById('promt');
    promt.parentNode.removeChild(promt);

    this.terminal.storage.data.push(this.parseInputField());
    this.inputField = [this.createElement('\u00A0')]; // init with space
    this.caret.input = this.inputField;
    this.caret.pos = null;

    this.terminal.render();
  }

  moveDrawLine(pos) {
    this.terminal.storage.drawLine = pos;
  }

  parseInputField() {
    return this.inputField.slice(0, -1);
  }

  move(dir) {
    this.caret.move(dir);
  }

  write(char) {
    if (typeof char === 'string') {
      this.inputField.splice(this.caret.pos, 0, this.createElement(char));      
    } else {
      this.inputField.splice(this.caret.pos, 0, char);
    }
    this.caret.move(1);
    this.checkCommand();
    this.render();
  }

  remove() {
    const removePos = this.caret.pos - 1;
    if (removePos >= 0) {
      this.inputField.splice(removePos, 1);
      this.caret.pos = removePos;
      this.checkCommand();
      this.render();
    }
  }

  parseCharArray(elementArray) {
    const charArray = elementArray.map(element => {
      return element.innerHTML;
    });
    return charArray.join('');
  }

  execute() {
    if (this.currentCommand) {
      this.commands[this.currentCommand]();
    }
    this.addStorage();
  }

  parseCommandOptions(options) {
    let parsedOptions = options.match(/\w+[\w+.]/g);
    console.log(parsedOptions);
  }

  checkCommand() {
    // Check for first word / command
    const commandString = this.parseCharArray(this.inputField);
    const commandCharArray = commandString.match(/^([a-z]+)(?=.*&)/g);
    const command = commandCharArray ? commandCharArray[0] : '';
  
    if (this.commands[command]) {
      this.currentCommand = command;
    } else {
      this.currentCommand = null;
    }
  }

  cancelCommand() {
    if (this.inputField.length > 1) {
      ['^', 'C'].forEach(char => {
        const element = this.createElement(char);
        element.classList.add('command-back');
        this.write(element);        
      });
      this.addStorage();
    }
  }
}

class Terminal {
  constructor() {
    this.window = document.getElementById('terminal');
    this.promt = new Promt(this);
    this.storage = new Storage(this.promt.prefix, this);
  }

  render() {
    this.clear();
    this.storage.render();
    this.promt.render();
  }

  parseString(string) {
    // TODO
    // For mouse right click clipboard copy.
  }

  clear() {
    this.window.innerHTML = null;
  }
}

const terminal = new Terminal();
terminal.render();

// MOVE THIS TO A SEPARATE FILE ASAP
const RELEASED = 0;
const PRESSED = 1;
let controlKey = null;

class Keyboard {
  constructor() {
    this.keyStates = new Map();
  }

  handleEvent(event) {
    const {code} = event;
    const keyState = event.type === 'keydown' ? PRESSED : RELEASED;
    event.preventDefault();
    if (keyState === 1) {
      switch (event.key) {
        case "ArrowDown":
          // TODO
          break;
        case "ArrowUp":
          // TODO
          break;
        case "ArrowLeft":
          terminal.promt.move(-1);
          break;
        case "ArrowRight":
          terminal.promt.move(1);
          break;
        case "Enter":
          terminal.promt.execute();
          //terminal.promt.addStorage();
          break;
        case 'Control':
          controlKey = 'control';
          break;
        case 'Shift':
          //TODO
          break;
        case ' ':
          terminal.promt.write('\u00A0');
          break;
        case "Backspace":
          terminal.promt.remove();
          break;
        default:
          if (controlKey === 'control' && event.key === 'c') {
            terminal.promt.cancelCommand();
          } else {
            terminal.promt.write(event.key);
          }
          return;
      }
    } else {
      if (event.key === 'Control') {
        controlKey = null;        
      }
    }
  
    if (this.keyStates.get(code) === keyState) {
      return;
    }

    this.keyStates.set(code, keyState);
  }

  listenTo(window) {
     ['keydown', 'keyup'].forEach(eventName => {
      window.addEventListener(eventName, event => {
        this.handleEvent(event);
      });
     })
  }
}

const keyboard = new Keyboard();
keyboard.listenTo(window);

window.terminalWindow = terminal;