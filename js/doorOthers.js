// ===================== Пример кода первой двери =======================
/**
 * @class Door0
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door0(number, onUnlock) {
    DoorBase.apply(this, arguments);
    var buttons = Array.from(this.popup.querySelectorAll('.door-riddle__button'));

    buttons.forEach(function (b) {
        b.addEventListener('pointerdown', _onButtonPointerDown.bind(this));
        b.addEventListener('pointerup', _onButtonPointerUp.bind(this));
        b.addEventListener('pointercancel', _onButtonPointerUp.bind(this));
        b.addEventListener('pointerleave', _onButtonPointerUp.bind(this));
    }.bind(this));

    function _onButtonPointerDown(e) {
        e.target.classList.add('door-riddle__button_pressed');
        _checkCondition.apply(this);
    }

    function _onButtonPointerUp(e) {
        e.target.classList.remove('door-riddle__button_pressed');
    }

    /**
     * Проверяем, можно ли теперь открыть дверь
     */
    function _checkCondition() {
        var isOpened = true;
        buttons.forEach(function (b) {
            if (!b.classList.contains('door-riddle__button_pressed')) {
                isOpened = false;
            }
        });

        // Если все три кнопки зажаты одновременно, то откроем эту дверь
        if (isOpened) {
            buttons.forEach(function (b) {
                b.classList.remove('door-riddle__button_pressed');
            });
            this.unlock();
        }
    }
}

// Наследуемся от класса DoorBase
Door0.prototype = Object.create(DoorBase.prototype);
Door0.prototype.constructor = DoorBase;
// END ===================== Пример кода первой двери =======================

/**
 * @class Door1
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door1(number, onUnlock) {
    // У этого входа нужно угадать рычаг
    // Один рычаг убъет вас, второй - пропустит
    DoorBase.apply(this, arguments);
    var that = this;
    var tmout;
    var transitionDurationMs = 200;
    var successCoord = 160;
    var randVal = Math.random(0, 1);

    var handles = Array.from(this.popup.querySelectorAll('.door-riddle__handle'));
    handles[0].successValue = randVal;
    handles[1].successValue = 1 - randVal;

    handles.forEach(function (h) {
        h.addEventListener('pointerdown', _handlePointerDown.bind(h));
        h.addEventListener('pointerup', _clearPointerMoveHandler.bind(h));
        h.addEventListener('pointercancel', _clearPointerMoveHandler.bind(h));
        h.addEventListener('pointerleave', _clearPointerMoveHandler.bind(h));
    }.bind(this));

    function _pointerMoveHandler(e) {
        var coord = Math.min(successCoord, Math.max(0, e.target.startPos - e.clientY));
        e.target.style.bottom = `${coord}px`;
    }

    function _handlePointerDown(e) {
        this.startPos = this.startPos || e.clientY;
        this.addEventListener('pointermove', _pointerMoveHandler);
    }

    function _clearPointerMoveHandler(e) {
        e.target.removeEventListener('pointermove', _pointerMoveHandler);
        this.style.transition = `bottom ${transitionDurationMs}ms`;
        console.log(this.style.bottom, successCoord)
        this.successReached = this.style.bottom === `${successCoord}px`;

        clearTimeout(tmout);
        tmout = setTimeout(function () {
            this.style.bottom = 0;
            _checkCondition();
            this.style.transition = null;
            this.successReached = false;
        }.bind(this), transitionDurationMs);
    }

    function _checkCondition() {
        var successValue = handles.filter(function (h) {
            return h.successReached === true;
        }).reduce(function (s, h) {
            return h.successValue + s;
        }, 0);
        console.log(successValue);
        if (successValue > 0) {
            if (successValue < 0.5) {
                that.unlock();
            } else if (successValue === 1) {
                alert('Дверь открыта, но вы убиты 💀, увы!');
                location.reload();
            } else {
                alert('Вы неугадали и поплатились 💀 жизнью...');
                location.reload();
            }
        }
    }
}
Door1.prototype = Object.create(DoorBase.prototype);
Door1.prototype.constructor = DoorBase;

/**
 * @class Door2
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door2(number, onUnlock) {
    DoorBase.apply(this, arguments);
    var that = this;

    var h = this.popup.querySelector('.door-riddle__circle__handle');
    var c = this.popup.querySelector('.door-riddle__circle');
    var locks = Array.from(this.popup.querySelectorAll('.door-riddle__circle__lock'));
    locks.forEach(function (l) {
        l.isPointContained = function (p) {
            var bb = l.getBoundingClientRect();
            if (p.y >= bb.top && p.y <= bb.bottom && p.x >= bb.left && p.x <= bb.right)
                return true;
            return false;
        };
        l.unlock = function () {
            l.classList.add('door-riddle__circle__lock_open');
        };
        l.lock = function () {
            l.classList.remove('door-riddle__circle__lock_open');
        };
        l.isUnlocked = function () {
            return l.classList.contains('door-riddle__circle__lock_open');
        };
    });
    var startPoint, leashLength;

    h.addEventListener('pointerdown', _handlePointerDown.bind(this.popup));
    h.addEventListener('pointerup', _clearPointerMoveHandler.bind(this.popup));
    h.addEventListener('pointercancel', _clearPointerMoveHandler.bind(this.popup));
    h.addEventListener('pointerleave', _clearPointerMoveHandler.bind(this.popup));

    function _handlePointerDown(e) {
        this.addEventListener('pointermove', _handlePointerMove);
        c.style.position = null;
        startPoint = _getElementCenter(h);
        leashLength = _getElementsCenterDist(c, h);
    }

    function _clearPointerMoveHandler(e) {
        this.removeEventListener('pointermove', _handlePointerMove);
        if (_checkCondition())
            that.unlock();
        locks.map(function (l) {
            l.lock();
        });
    }

    function _checkCondition() {
        return locks.filter(function (l) {
            return !l.isUnlocked()
        }).length === 0;
    }

    function _handlePointerMove(e) {
        if (e.target === h) {
            var movementX = e.pageX - startPoint.x;
            var movementY = e.pageY - startPoint.y;
            startPoint = {
                x: e.pageX,
                y: e.pageY
            };

            var prevTop = h.style.top;
            var prevLeft = h.style.left;
            var d = /(-?)\s*(\d*)px/.exec(h.style.top);
            h.style.top = `calc(50% + ${parseInt(d[1] + d[2]) + movementY}px)`;
            h.style.left = `${parseInt(h.style.left.split('px')[0]) + movementX}px`;
            var dist = _getElementsCenterDist(c, h);
            if (dist > leashLength * 1.1 || dist < leashLength * 0.9) {
                // если ручка вылезла за границы желоба
                h.style.top = prevTop;
                h.style.left = prevLeft;
            } else {
                // проверим, прошла ли ручка через замок
                var cntr = _getElementCenter(h);
                locks.map(function (l) {
                    if (l.isPointContained(cntr))
                        l.unlock();
                });
            }
        }
    }

    function _getElementCenter(e) {
        // определение центра элемента
        var bb = e.getBoundingClientRect();
        return {
            y: bb.top + bb.height / 2,
            x: bb.left + bb.width / 2
        };
    }

    function _getElementsCenterDist(e1, e2) {
        // расстояние между центрами элементов
        var b1 = _getElementCenter(e1);
        var b2 = _getElementCenter(e2);
        return Math.sqrt(Math.pow(b1.x - b2.x, 2) + Math.pow(b1.y - b2.y, 2));
    }

}
Door2.prototype = Object.create(DoorBase.prototype);
Door2.prototype.constructor = DoorBase;

/**
 * Сундук
 * @class Box
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Box(number, onUnlock) {
    DoorBase.apply(this, arguments);
    // постучите три раза м свайпните вверх двумя пальцами
    var knocksLeft = 3;
    var startPos;

    this.popup.addEventListener('click', _handleKnock.bind(this));

    function _handleKnock() {
        if (!knocksLeft) return;

        knocksLeft -= 1;
        audio.play()
        setTimeout(function () {
            audio.pause()
            if (!knocksLeft) {
                alert('Кажется, сундук открыт...');
            }
        }, 2500);
        if (!knocksLeft) {
            this.popup.addEventListener('pointerdown', _handlePointerDown.bind(this));
            this.popup.addEventListener('pointerup', _handlePointerUp.bind(this));
            this.popup.addEventListener('pointerleave', _handlePointerUp.bind(this));
            this.popup.addEventListener('pointercancel', _handlePointerUp.bind(this));
        }
    }

    function _handlePointerDown(e) {
        if (!e.isPrimary) {
            this.popup.addEventListener('pointermove', _handlePointerMove.bind(this));
            startPos = e.pageY;
        }
    }

    function _handlePointerUp(e) {
        this.popup.removeEventListener('pointermove', _handlePointerMove.bind(this));
    }

    function _handlePointerMove(e) {
        if (!e.isPrimary) {
            this.popup.removeEventListener('pointermove', arguments.callee);
            if (startPos - e.pageY > 200) {
                this.unlock();
            }
        }
    }

    this.showCongratulations = function () {
        alert('Поздравляю! 💰 💎 ⚱️ Игра пройдена!');
    };
}
Box.prototype = Object.create(DoorBase.prototype);
Box.prototype.constructor = DoorBase;

var audio = new Audio('sounds/key.mp3');
audio.play();
setTimeout(function () {
    audio.pause();
}, 200);
