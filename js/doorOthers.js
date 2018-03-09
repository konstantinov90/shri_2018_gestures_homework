// ===================== Пример кода первой двери =======================
/**
 * @class Door0
 * @augments DoorBase
 * @param {Number} number
 * @param {Function} onUnlock
 */
function Door0(number, onUnlock) {
    DoorBase.apply(this, arguments);
    var buttons = [
        this.popup.querySelector('.door-riddle__button_0'),
        this.popup.querySelector('.door-riddle__button_1'),
        this.popup.querySelector('.door-riddle__button_2')
    ];

    buttons.forEach(function(b) {
        b.addEventListener('pointerdown', _onButtonPointerDown.bind(this));
        b.addEventListener('pointerup', _onButtonPointerUp.bind(this));
        b.addEventListener('pointercancel', _onButtonPointerUp.bind(this));
        b.addEventListener('pointerleave', _onButtonPointerUp.bind(this));
    }.bind(this));

    function _onButtonPointerDown(e) {
        e.target.classList.add('door-riddle__button_pressed');
        checkCondition.apply(this);
    }

    function _onButtonPointerUp(e) {
        e.target.classList.remove('door-riddle__button_pressed');
    }

    /**
     * Проверяем, можно ли теперь открыть дверь
     */
    function checkCondition() {
        var isOpened = true;
        buttons.forEach(function(b) {
            if (!b.classList.contains('door-riddle__button_pressed')) {
                isOpened = false;
            }
        });

        // Если все три кнопки зажаты одновременно, то откроем эту дверь
        if (isOpened) {
            buttons.forEach(function(b) {
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
    var randVal = Math.random(0,1);

    var handles = [
        this.popup.querySelector('.door-riddle__handle_0'),
        this.popup.querySelector('.door-riddle__handle_1')
    ];
    handles[0].successValue = randVal;
    handles[1].successValue = 1-randVal;

    handles.forEach(function(h) {
        h.addEventListener('pointerdown', _onHandlePointerDown.bind(h));
        h.addEventListener('pointerup', _clearPointerMoveHandler.bind(h));
        h.addEventListener('pointercancel', _clearPointerMoveHandler.bind(h));
        h.addEventListener('pointerleave', _clearPointerMoveHandler.bind(h));
    }.bind(this));

    function _pointerMoveHandler(e) {
        var coord = Math.min(successCoord, Math.max(0, e.target.startPos - e.clientY));
        e.target.style.bottom = `${coord}px`;
    }

    function _onHandlePointerDown(e) {
        this.startPos = this.startPos || e.clientY;
        this.addEventListener('pointermove', _pointerMoveHandler);
    }

    function _clearPointerMoveHandler(e) {
        e.target.removeEventListener('pointermove', _pointerMoveHandler);
        this.style.transition = `bottom ${transitionDurationMs}ms`;

        this.successReached = this.style.bottom === `${successCoord}px`;

        this.style.bottom = 0;
        clearTimeout(tmout);
        tmout = setTimeout(function() {
            checkCondition();
            this.style.transition = null;
            this.successReached = false;
        }.bind(this), transitionDurationMs);
    }
    
    function checkCondition() {
        var successValue = handles.filter(function(h) {
            return h.successReached === true;
        }).reduce(function(s, h) {
            return h.successValue + s;
        }, 0);
        console.log(successValue);
        if (successValue > 0) {
            if (successValue < 0.5) {
                that.unlock();
            } else if (successValue === 1) {
                alert('Дверь открыта, но вы убиты, увы!');
                location.reload();
            } else {
                alert('Вы неугадали и поплатились жизнью...');
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

    var h = this.popup.querySelector('.door-riddle__circle__handle');
    var c = this.popup.querySelector('.door-riddle__circle');
    var startPoint, initDistance;


    h.addEventListener('pointerdown', _onHandlePointerDown.bind(this.popup));
    h.addEventListener('pointerup', _clearPointerMoveHandler.bind(this.popup));
    h.addEventListener('pointercancel', _clearPointerMoveHandler.bind(this.popup));
    h.addEventListener('pointerleave', _clearPointerMoveHandler.bind(this.popup));

    function _onHandlePointerDown(e) {
        this.addEventListener('pointermove', _onPointerMove);
        c.style.position = null;
        startPoint = _getElementCenter(h);
        initDistance = _getElementsCenterDist(c, h);
    }
    
    function _clearPointerMoveHandler(e) {
        this.removeEventListener('pointermove', _onPointerMove);
    }
    
    function _onPointerMove(e) {
        var ptrn = /(-?)\s*(\d*)px/;
        if (e.target === h) {
            var movementX = /*e.movementX ||*/ (e.clientX - startPoint.x);
            var movementY = /*e.movementY ||*/ (e.clientY - startPoint.y);
            startPoint = {
                x: e.clientX,
                y: e.clientY
            };

            var prevTop = h.style.top;
            var prevLeft = h.style.left;
            var d = ptrn.exec(h.style.top);
            h.style.top = `calc(50% + ${parseInt(d[1] + d[2]) + movementY}px)`;
            h.style.left = `${parseInt(h.style.left.split('px')[0]) + movementX}px`;
            var dist = _getElementsCenterDist(c, h);
            console.log(e)
            console.log(dist, movementX, movementY)
            if (dist > initDistance*1.1 || dist < initDistance*0.9) {
                h.style.top = prevTop;
                h.style.left = prevLeft;
            }
        }
    }

    function _getElementCenter(e) {
        var bb = e.getBoundingClientRect();
        return {
            y: bb.top + bb.height / 2,
            x: bb.left + bb.width / 2
        };
    }

    function _getElementsCenterDist(e1, e2) {
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

    // ==== Напишите свой код для открытия сундука здесь ====
    // Для примера сундук откроется просто по клику на него
    this.popup.addEventListener('click', function() {
        this.unlock();
    }.bind(this));
    // ==== END Напишите свой код для открытия сундука здесь ====

    this.showCongratulations = function() {
        alert('Поздравляю! Игра пройдена!');
    };
}
Box.prototype = Object.create(DoorBase.prototype);
Box.prototype.constructor = DoorBase;
