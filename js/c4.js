var el = document.getElementById.bind(document), Map, Block, Player, Game, Messages;

/**
 * The Player constructor.
 *
 * @param {Array} options
 * @returns {Player}
 */
Player = function(options) {
    this.name = options.name;
    this.color = options.color;
};

/**
 * The Block constructor.
 *
 * @param {Array} options
 * @returns {Block}
 */
Block = function(options) {
    this.$element = options.$element;
    this.row = options.row;
    this.column = options.column;
    this.player = -1;
};

/**
 * The Map constructor. Holds references to all Blocks
 *
 * @param {Array} options
 * @returns {Map}
 */
Map = function(options) {
    this.rules = [];
    this.blocks = [];
    this.rows = options.rows;
    this.columns = options.columns;

    this.$map = el(options.map);

    this.$rule = this.$map.removeChild(el(options.rule));
    this.$rule.removeAttribute('id');

    this.$block = this.$map.removeChild(el(options.block));
    this.$block.removeAttribute('id');

    this.init();
};

/**
 * Build the Map grid
 *
 * @returns {undefined}
 */
Map.prototype.init = function() {
    var rows = this.rows, columns = this.columns;

    while (rows--) {
        while (columns--) {
            this.addBlock(rows, columns);
        }
        this.addRule();
        columns = this.columns;
    }
};

/**
 * Add a Block to the Map
 *
 * @param {Number} row
 * @param {Number} column
 * @returns {undefined}
 */
Map.prototype.addBlock = function(row, column) {
    var $element = this.$block.cloneNode();

    this.blocks.push(new Block({
        $element: $element,
        row: row,
        column: column
    }));

    this.$map.appendChild($element);
};

/**
 * Add a horizontal rule to the Map so that the "line" of Blocks is renderd as a grid
 *
 * @returns {undefined}
 */
Map.prototype.addRule = function() {
    var $element = this.$rule.cloneNode();

    this.rules.push($element);
    this.$map.appendChild($element);
};

/**
 * The game constructor. Holds references to the Map, Messages and all Players
 *
 * @param {Array} options
 * @returns {Game}
 */
Game = function(options) {
    this.player;
    this.players = [];
    this.limit = options.limit;
    this.highlight = options.highlight;
    this.map = new Map(options.map);
    this.messages = new Messages(options.messages);

    options.players.forEach(this.addPlayer.bind(this));
};

/**
 * Add a player to the game
 *
 * @param {Array} options
 * @returns {undefined}
 */
Game.prototype.addPlayer = function(options) {
    var player = new Player(options);
    this.players.push(player);
};

/**
 * When the game starts add event listeners to all Blocks
 *
 * @param {Block} block
 * @returns {undefined}
 */
Game.prototype.addBlockEvents = function(block) {
    block.$element.onclick = this.addPlayerEvent.bind(this, block.column);
};

/**
 * When the game ends clean all event listeners from all Blocks
 *
 * @param {Block} block
 * @returns {undefined}
 */
Game.prototype.removeBlockEvents = function(block) {
    block.$element.onclick = null;
};

/**
 * Handle when a player clicks a Block.
 * If the block is free - claim it.
 * If it is the 4th winning block - end game with win.
 * If it is the last free block - end game with draw.
 * If there are no more blocks in the column - invalid move.
 *
 * @param {Number} column
 * @returns {undefined}
 */
Game.prototype.addPlayerEvent = function(column) {
    var block = this.findFreeBlock(column);
    if (!block) {
        this.messages.write('Invalid move');
        return;
    }

    block.player = this.player;
    block.$element.className += ' ' + this.players[this.player].color;

    if (this.isWin()) {
        this.messages.write('<strong>' + this.players[this.player].name + ' wins!</strong>');
        return;
    }

    if (this.isDraw()) {
        this.messages.write('<strong>Draw!</strong>');
        return;
    }

    this.player = +!this.player;
    this.messages.write(this.players[this.player].name + '\'s turn');
};

/**
 * Find the first free Block in a column
 *
 * @param {Number} column
 * @returns {Block|undefined}
 */
Game.prototype.findFreeBlock = function(column) {
    var blocks = this.map.blocks.length;
    while (blocks--) {
        if (this.map.blocks[blocks].column === column && this.map.blocks[blocks].player === -1) {
            return this.map.blocks[blocks];
        }
    }
};

/**
 * Check if there are no more moves left
 *
 * @returns {Boolean}
 */
Game.prototype.isDraw = function() {
    var blocks = this.map.blocks.length;
    while (blocks--) {
        if (this.map.blocks[blocks].player === -1) {
            return false;
        }
    }

    this.map.blocks.forEach(this.removeBlockEvents.bind(this));
    return true;
};

/**
 * Check if a player has won.
 *
 * @returns {Boolean}
 */
Game.prototype.isWin = function() {
    var check = function(game, current, step, horizontal) {
        var highlight = [], found = 0, blocks = game.map.blocks, iterator, block, index, row;

        for (iterator = 0; iterator < game.limit; iterator++) {
            index = current - step * iterator;
            if (index >= 0 && index < blocks.length) {
                block = blocks[index];
                if (block.player === game.player) {
                    if (horizontal && +row !== +row) {
                        row = block.row;
                    }
                    if ((horizontal && row === block.row) || (!horizontal && row !== block.row)) {
                        row = block.row;
                        highlight.push(block);
                        found++;
                    }
                }
            }
        }

        if (found === game.limit) {
            if (game.highlight) {
                highlight.forEach(function(block) {
                    block.$element.className += ' ' + game.highlight;
                });
            }
            return true;
        }

        return false;
    }, blocks = this.map.blocks.length, found = false;

    while (blocks--) {
        if (found = check(this, blocks, 1, true)) {
            break;
        }
        if (found = check(this, blocks, this.map.columns)) {
            break;
        }
        if (found = check(this, blocks, this.map.columns + 1)) {
            break;
        }
        if (found = check(this, blocks, this.map.columns - 1)) {
            break;
        }
    }

    if (!found) {
        return false;
    }

    this.map.blocks.forEach(this.removeBlockEvents.bind(this));
    return true;
};

/**
 * Pick a random player and start a game
 *
 * @returns {undefined}
 */
Game.prototype.play = function() {
    this.map.blocks.forEach(this.addBlockEvents.bind(this));
    this.player = +(Math.random() < .5);

    this.messages.write('Welcome');
    this.messages.write(this.players[this.player].name + '\'s turn');
};

/**
 * Activity messages manager
 *
 * @param {type} options
 * @returns {Messages}
 */
Messages = function(options) {
    this.messages = [];
    this.$messages = el(options.messages);
    this.$message = this.$messages.removeChild(el(options.message));
    this.$message.removeAttribute('id');
};

/**
 * Record a message and output it
 *
 * @param {String} message
 * @returns {undefined}
 */
Messages.prototype.write = function(message) {
    if (!message) {
        return;
    }

    var $element = this.$message.cloneNode();
    $element.innerHTML = message;

    this.messages.push($element);
    this.$messages.appendChild($element);
};
