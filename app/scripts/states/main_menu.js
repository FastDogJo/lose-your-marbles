'use strict';

define(['phaser', 'config', 'util/gestures', 'prefabs/base_menu', 'prefabs/main_menu', 'prefabs/options_menu', 'prefabs/fade_tween', 'util'], function(Phaser, Config, Gesture, BaseMenu, MainMenu, OptionsMenu, FadeTween, Util) {
    function MainMenuState() {}

    MainMenuState.States = {
        MAIN: 'main',
        OPTIONS: 'options',
        TRANSITION: 'transition'
    };
    
    MainMenuState.prototype = {
        create: function() {
            this.fx = Util.parseAudioSprite(this.game);
            
            this.background = this.game.add.sprite(0, 0, 'marbleatlas', 'DIALOG_BG');
            
            this.fadeBg = new FadeTween(this.game, 0xffffff, 1);
            this.game.add.existing(this.fadeBg);

            this.menu = new MainMenu(this.game, this.fx);

            this.optionsMenu = null;

            this.menuState = MainMenuState.States.TRANSITION;
            
            this.upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            this.downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
            this.leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
            this.rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
            this.spacebarKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

            this.gesture = new Gesture(this.game);
            
            this.tweenFadeOut();
        },

        update: function() {
            this.gesture.update();
        },

        gameStart: function() {
            this.game.state.start('level-master');
        },
        
        menuPopped: function() {
            this.upKey.onDown.add(this.keyPress.bind(this, BaseMenu.Select.UP));
            this.downKey.onDown.add(this.keyPress.bind(this, BaseMenu.Select.DOWN));
            this.leftKey.onDown.add(this.keyPress.bind(this, BaseMenu.Select.LEFT));
            this.rightKey.onDown.add(this.keyPress.bind(this, BaseMenu.Select.RIGHT));

            this.spacebarKey.onDown.add(this.keyEnter, this);
            this.enterKey.onDown.add(this.keyEnter, this);

            this.gesture.onTap.add(this.tapped, this);
            this.gesture.onHold.add(this.holded, this);
            this.gesture.onSwipe.add(this.swiped, this);
            
            this.menuState = MainMenuState.States.MAIN;
        },

        tapped: function(e, pos) {
            if (this.menuState === MainMenuState.States.MAIN) {
                if (this.menu.tap(pos) !== -1) {
                    this.menu.playSelectSound();
                }
            } else if (this.menuState === MainMenuState.States.OPTIONS) {
                if (this.optionsMenu.tap(pos) !== -1) {
                    this.menu.stopSound();
                    this.menu.playSelectSound();
                }
            }
        },

        holded: function(e, pos) {
            if (this.menuState === MainMenuState.States.MAIN) {
                if (this.menu.tap(pos) !== -1) {
                    this.mainMenuSelect();
                    this.menu.stopSound();
                }
            } else if (this.menuState === MainMenuState.States.OPTIONS) {
                if (this.optionsMenu.tap(pos) !== -1) {
                    this.optionsMenuSelect();
                }
            }
        },

        swiped: function(e, prev, pos, direction) {
            switch(direction) {
            case Gesture.SwipeDirection.UP:
                direction = BaseMenu.Select.UP;
                break;
            case Gesture.SwipeDirection.DOWN:
                direction = BaseMenu.Select.DOWN;
                break;
            case Gesture.SwipeDirection.LEFT:
                direction = BaseMenu.Select.LEFT;
                break;
            case Gesture.SwipeDirection.RIGHT:
                direction = BaseMenu.Select.RIGHT;
                break;
            }

            this.keyPress(direction);
        },

        keyPress: function(key) {
            if (this.menuState === MainMenuState.States.MAIN) {
                if (this.menu.select(key) !== -1) {
                    this.menu.playSelectSound();
                }
            } else if (this.menuState === MainMenuState.States.OPTIONS) {
                if (this.optionsMenu.select(key) !== -1) {
                    this.menu.stopSound();
                    this.menu.playSelectSound();
                }
            }
        },

        keyEnter: function() {
            if (this.menuState === MainMenuState.States.MAIN) {
                this.mainMenuSelect();
                this.menu.stopSound();
            } else if (this.menuState === MainMenuState.States.OPTIONS) {
                this.optionsMenuSelect();
            }
        },

        mainMenuSelect: function() {
            switch(this.menu.getSelection()) {
            case MainMenu.Items.OPTIONS:
                this.selectOptions();
                break;
            case MainMenu.Items.HELP:
                break;
            case MainMenu.Items.PLAY:
            case MainMenu.Items.SAM:
                this.selectPlay();
                break;
            case MainMenu.Items.QUIT:
                Config.options.onGameQuit.call(Config, this.levelData);
                break;
            }
        },

        optionsMenuSelect: function() {
            switch(this.optionsMenu.getSelection()) {
            case OptionsMenu.Items.EXIT:
                this.menuState = MainMenuState.States.TRANSITION;
                this.tweenMainMenu();
                break;
            case OptionsMenu.Items.CREDITS:
                break;
            }
        },

        selectPlay: function() {
            this.menuState = MainMenuState.States.TRANSITION;
            this.tweenPlayState();
            Util.playSfx(this.fx, 'ZOOMIN');
        },

        selectOptions: function() {
            this.optionsMenu = this.optionsMenu ||
                new OptionsMenu(this.game);

            this.menuState = MainMenuState.States.TRANSITION;
            this.tweenOptionsMenu();
        },

        tweenFadeOut: function() {
            var tween = this.game.add.tween(this.fadeBg)
                    .to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true);

            var tweenMainMenuPop = this.game.add.tween(this.menu.scale)
                    .to({x: 1, y: 1}, 500, Phaser.Easing.Bounce.Out);

            tweenMainMenuPop.onStart.add(function() {
                Util.playSfx(this.fx, 'ZOOMIN');
            }, this);

            tweenMainMenuPop.onComplete.add(this.menuPopped, this);
            
            tween.chain(tweenMainMenuPop);
        },

        tweenPlayState: function() {
            var tweenMainMenuShrink = this.game.add.tween(this.menu.scale)
                    .to({x: 0, y: 0}, 200, Phaser.Easing.Linear.None);

            var tweenFadeIn = this.game.add.tween(this.fadeBg)
                    .to({alpha: 1}, 2000, Phaser.Easing.Linear.None);

            tweenFadeIn.onComplete.add(this.gameStart, this);
            
            tweenMainMenuShrink.chain(tweenFadeIn);

            tweenMainMenuShrink.start();
        },

        tweenOptionsMenu: function() {
            this.tweenTransitionMenu(this.menu, this.optionsMenu, MainMenuState.States.OPTIONS);
        },

        tweenMainMenu: function() {
            this.tweenTransitionMenu(this.optionsMenu, this.menu, MainMenuState.States.MAIN);
        },

        tweenTransitionMenu: function(shrinkMenu, growMenu, onCompleteState) {
            var tweenMenuShrink = this.game.add.tween(shrinkMenu.scale)
                    .to({ x: 0, y: 0}, 300);

            var tweenMenuGrow = this.game.add.tween(growMenu.scale)
                    .to({ x: 1, y: 1}, 300, Phaser.Easing.Bounce.Out);

            tweenMenuGrow.onStart.add(function() {
                Util.playSfx(this.fx, 'ZOOMIN');
            }, this);

            tweenMenuGrow.onComplete.add(function() {
                this.menuState = onCompleteState;
            }, this);

            tweenMenuShrink.chain(tweenMenuGrow);

            tweenMenuShrink.start();
            Util.playSfx(this.fx, 'ZOOMIN');
        }
    };

    return MainMenuState;
});
