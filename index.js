import { Observable, Subject, BehaviorSubject, Scheduler } from 'rxjs';
import { head, last, tail, concat } from 'ramda';
import { fromJS } from 'immutable';

const canvas = document.getElementById('snake');
canvas.width = 500;
canvas.height = 300;
const context = canvas.getContext('2d');

const collision$ = new Subject();
const score$ = new BehaviorSubject(0).scan((acc, score) => acc + score, 0);

score$.subscribe(score => {
    document.querySelector('.score').innerHTML = score;
});

const createFood = food => ({
    makePosition(n) {
        return Math.round(Math.floor(Math.random() * n) / 10) * 10;
    },
    create(snake) {
        const newFood = fromJS([
            this.makePosition(500),
            this.makePosition(300),
        ]);
        if (snake.collision(newFood)) this.create(snake);
        else food = newFood;
    },
    collision(pos, snake) {
        if (pos.equals(food)) {
            this.create(snake);
            this.draw();
            score$.next(7);
            return true;
        } else return false;
    },
    draw() {
        // const hex = Math.floor(Math.random() * 16777215).toString(16);
        context.fillStyle = '#32CD32'; // `#${hex}`;
        context.fillRect(food.get(0), food.get(1), 10, 10);

        return this;
    },
});

const arena = {
    collision(pos) {
        const [x, y] = [pos.get(0), pos.get(1)];

        return (
            x < 0 ||
            x >= context.canvas.width ||
            y < 0 ||
            y >= context.canvas.height
        );
    },
};

const food = createFood(fromJS([250, 150])).draw();

const createSnake = snake => ({
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
    move(keyCode) {
        const newLink = this.link.create(snake.last(), keyCode);
        if (this.collision(newLink) || arena.collision(newLink)) {
            collision$.next(true);
        } else {
            if (!food.collision(newLink, this)) {
                this.link.clear(snake.first());
                snake = snake.rest();
            }
            snake = snake.push(newLink);
            this.link.draw(newLink);
        }
    },
});

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

let previousMove;

const interval$ = Observable.interval(100, Scheduler.requestAnimationFrame);
const keydown$ = Observable.fromEvent(document, 'keydown')
    .map(e => e.keyCode)
    .filter(keyCode => [37, 38, 39, 40].includes(keyCode))
    .filter(keyCode => !previousMove || (keyCode + previousMove) % 2)
    .do(keyCode => (previousMove = keyCode));

const game$ = interval$.withLatestFrom(keydown$).takeUntil(collision$);

game$.subscribe(([interval, keyCode]) => snake.move(keyCode));
