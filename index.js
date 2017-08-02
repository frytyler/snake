import { Observable, Subject } from 'rxjs';
import { head, last, tail, concat } from 'ramda';
import { fromJS } from 'immutable';

const canvas = document.getElementById('snake');
canvas.width = 500;
canvas.height = 300;
const context = canvas.getContext('2d');

const collision$ = new Subject();

const food = {
    collision() {
        return false;
    },
};

const arena = {
    collision() {
        return false;
    },
};

const createSnake = snake => {
    return {
        link: {
            clear(pos) {
                context.clearRect(pos.get(0), pos.get(1), 10, 10);
            },
            create(pos, keyCode) {
                switch (keyCode) {
                    case 37:
                        return pos.update(0, v => v - 10);
                    case 38:
                        return pos.update(1, v => v - 10);
                    case 39:
                        return pos.update(0, v => v + 10);
                    case 40:
                        return pos.update(1, v => v + 10);
                    default:
                        return pos;
                }
            },
            draw(pos) {
                const hex = Math.floor(Math.random() * 16777215).toString(16);
                context.fillStyle = `#${hex}`;
                context.fillRect(pos.get(0), pos.get(1), 10, 10);
            },
        },
        collision(pos) {
            return snake.find(v => v.equals(pos)) ? true : false;
        },
        draw() {
            snake.forEach(this.link.draw);
            return this;
        },
        move(keyCode = 39) {
            // clear previous link
            this.link.clear(snake.first());
            // create new link from latest
            const newLink = this.link.create(snake.last(), keyCode);
            if (
                this.collision(newLink) ||
                food.collision(newLink) ||
                arena.collision(newLink)
            ) {
                collision$.next(true);
            } else {
                // update the snake
                snake = snake.rest().push(newLink);
                // draw new link
                this.link.draw(newLink);
            }
        },
    };
};

const snake = createSnake(
    fromJS([
        [0, 290],
        [10, 290],
        [20, 290],
        [30, 290],
        [40, 290],
        [50, 290],
        [60, 290],
        [70, 290],
    ])
).draw();

const interval$ = Observable.interval(200);
const keydown$ = Observable.fromEvent(document, 'keydown')
    .map(e => e.keyCode)
    .filter(keyCode => [37, 38, 39, 40].includes(keyCode));

const game = Observable.combineLatest(keydown$, interval$).takeUntil(
    collision$
);

game.subscribe(([keyCode, ...rest]) => {
    snake.move(keyCode);
});
