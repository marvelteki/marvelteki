const _ = require('underscore');
const Player = require('./Player.js');

class Game {
    constructor(game) {
        this.players = {};

        _.each(game.players, player => {
            this.players[player.id] = new Player(player);
        });

        this.name = game.name;
        this.id = game.id;
    }

    getState(activePlayer) {
        var playerState = {};

        _.each(this.players, player => {
            playerState[player.id] = player.getState(activePlayer === player.id);
        });

        return {
            name: this.name,
            players: playerState
        };
    }

    startGameIfAble() {
        if(_.all(this.players, player => {
            return player.readyToStart;
        })) {
            _.each(this.players, player => {
                player.startGame();
            });
        }
    }

    mulligan(playerId) {
        var player = _.find(this.players, player => {
            return player.id === playerId;
        });

        player.mulligan();
    }

    keep(playerId) {
        var player = _.find(this.players, player => {
            return player.id === playerId;
        });

        player.keep();
    }

    playCard(playerId, card) {
        var player = _.find(this.players, player => {
            return player.id === playerId;
        });

        player.playCard(card);
    }

    setupDone(playerId) {
        var player = _.find(this.players, player => {
            return player.id === playerId;
        });

        player.setupDone();

        if(!_.all(this.players, p => {
            return p.setup;
        })) {
            player.menuTitle = 'Waiting for opponent to finish setup';
            player.buttons = [];
        } else {
            _.each(this.players, p => {
                p.startPlotPhase();
            });
        }
    }

    selectPlot(playerId, plot) {
        var player = _.find(this.players, player => {
            return player.id === playerId;
        });

        player.selectPlot(plot);

        if(!_.all(this.players, p => {
            return !!p.selectedPlot;
        })) {
            player.menuTitle = 'Waiting for opponent to select plot';
            player.buttons = [];
        } else {
            var highestPlayer = undefined;
            var highestInitiative = 0;
            _.each(this.players, p => {
                if(p.selectedPlot.card.initiative > highestInitiative) {
                    highestInitiative = p.selectedPlot.card.initiative;
                    highestPlayer = p;
                }

                p.revealPlots();
            });

            highestPlayer.firstPlayer = true;
            highestPlayer.menuTitle = 'Select a first player';
            highestPlayer.buttons = [
                { command: 'firstplayer', text: 'Me', arg: 'me' },
                { command: 'firstplayer', text: 'Opponent', arg: 'opponent' }
            ];

            var otherPlayer = _.find(this.players, player => {
                return player.id !== highestPlayer.id;
            });

            if(otherPlayer) {
                otherPlayer.menuTitle = 'Waiting for opponent to select first player';
            }
        }
    }

    setFirstPlayer(sourcePlayer, who) {
        var firstPlayer = undefined;

        _.each(this.players, player => {
            if(player.id === sourcePlayer && who === 'me') {
                player.firstPlayer = true;
                firstPlayer = player;
            } else {
                player.firstPlayer = false;
            }

            player.drawPhase();
            player.menuTitle = '';
            player.buttons = [];
        });

        firstPlayer.beginMarshal();
    }

    initialise() {
        _.each(this.players, player => {
            player.initialise();
        });
    }
}

module.exports = Game;
