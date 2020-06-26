// интерфейс
var dir, start_pause, restart, change_player, section;// 
var game, info; 
var x_fault, y_fault; // смещение канвас  верхнего левого угла 

// логика
var bGame;

// основное поле
var canvas, ctx;

// вводим background
var image = new Image(900, 600); //фон
image.src = 'фон3.jpg'; //фон

// данные
var name = ""; //имя игрока
var score; //счёт
var hp; //здоровья
var enemy_list = []; //массив врагов 
var bullet_list = []; //массив ядер 
var level = 1; //текущий уровень 

// всё для пушки
var gun; //пушка
var gun_x, gun_y; //координаты пушки
var angle; //начальный угол орудия
var draw_angle; //угол для отрисовки 
var tic; // время перезарядки

// вводим картинки врагов
var en1 = new Image(200, 200);
en1.src = 'враг1.png';
var en2 = new Image(150, 150);
en2.src = 'враг2.png';
var en3 = new Image(150, 150);
en3.src = 'враг3.png';
var en4 = new Image(150, 150);
en4.src = 'враг4.png';

// таймер
var game_timer;


function new_session() { // считываем  имя и инициализируем все данные 
    check_name();
    init();
}

// главная, для инициализпции игры
function init() {
    dir = "game"; // хранит имя раздела в котором мы нахоимся для html 
    canvas = document.getElementById('canvas');
    gun = new Gun;
    gun_x = 50;
    gun_y = canvas.height - 50;
    score = 0;
    hp = 5;
    level = 1;
    // Градусы -> радианы
    // угол для балистики 
    angle = 45 * Math.PI / 180;
    // угол для отрисовки 
    draw_angle = 45 * Math.PI / 180;
    tic = 0; // время перезарядки
    enemy_list = [];
    bullet_list = [];
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');
        drawBack(ctx, canvas.width, canvas.height);
        // узнаем координаты начала канвас
        x_fault = canvas.getBoundingClientRect().left;
        y_fault = canvas.getBoundingClientRect().top;
    }

    // привязываем кнопки отвечающих за интерфейс
    start_pause = document.getElementById("кнопка1");
    restart = document.getElementById("кнопка2");
    change_player = document.getElementById("кнопка3");
    section = document.getElementById("кнопка4");
    game = document.getElementById("game"); 
    info = document.getElementById("info");
    bGame = false;
}

function drawBack(ctx, w, h) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // вставляем фон
    ctx.drawImage(image, 0, 0);
    // пишем информацию о жизнях и очках
    draw_info();
    // рисуем ядра 
    for (i = 0; i < bullet_list.length; i++)
        bullet_list[i].draw(ctx);
    // рисуем врагов
    for (i = 0; i < enemy_list.length; i++)
        enemy_list[i].draw(ctx);
    // рисуем пушку
    gun.draw(ctx);
}

// для выстрела
function shoot() {
    // если игра идёт и время перезарядки достигло 150 милисекунд
    if (bGame && (tic >= 150)) {
        // то обнуляем время перезарядки
        tic = 0;
        // добавляем новое ядро в список 
        bullet_list.push(new Bullet(angle));
    }
}

// для вращения пушки
function rotate(event) { // передаем событие перемещение мыши 
    // если игра началась
    if (bGame) {
        let dx = event.x - x_fault - 50;
        let dy = canvas.height + y_fault - event.y - 50;
        // ограничение угла наклона пушки 
        if (dy >= 0 && dx >= 0) {
            // угол для балистики 
            angle = Math.atan2(dy, dx);
            // угол для отрисовки(поворота) пушки 
            draw_angle = Math.atan2(dx, dy);
        }
    }
}

// отвечает за начало и паузу
function change_status() {
    if (!bGame) { //если игра запущена
        bGame = true;
        start_pause.value = "Пауза"; // меняем значение на паузу
        //отключаем кпоки
        restart.disabled = true;
        change_player.disabled = true;
        section.disabled = true;
        // setInterval - позволяет вызывать функцию play() регулярно, повторяя вызов через 1 милисекунду
        game_timer = setInterval('play();', 1);
        return;
    }
    if (bGame) {
        bGame = false;
        start_pause.value = "Играть"; // меняем значение на играть
        //включаем кнопки
        restart.disabled = false;
        change_player.disabled = false;

        section.disabled = false;
        // clearInterval - отменяет многократные повторения действий, установленные вызовом функции setInterval()
        clearInterval(game_timer);
        return;
    }
}

// отвечает за просмотр таблицы игроков
function change_section() {
    // если если ноходимся в таблице
    if (dir == "info") {
        // то переходим в игру
        dir = "game";
        //включаем кнопки
        start_pause.disabled = false;
        restart.disabled = false;
        change_player.disabled = false;
        // меняем значение на таблица
        section.value = "Таблица";
        // делаем таблицу невидимой
        info.style.display = "none";
        // делаем игру видимой
        game.style.display = "block";
        return;
    }
    // если если находимся в игре
    if (dir == "game") {
        // то переходим в таблицу
        dir = "info";
        //отключаем кпоки
        start_pause.disabled = true;
        restart.disabled = true;
        change_player.disabled = true;
        //меняем значение на игра
        section.value = "Игра";
        info.style.display = "block";
        game.style.display = "none";
        display_table();
        return;
    }
}

// задаем рандомное число
function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}


function play() {
    if (hp > 0) { // если у нас есть жизни
        // рисуем все характеристики
        drawBack(ctx, canvas.width, canvas.height);
        // увеличиваем время перезарядки
        tic++;
        // подсчитываем уровень за счет очков
        level = score / 500 + 1;
        // увеличение количества врагов  на 2 в зависимости от уровня
        en_amount = 3 + level * 2;

        // для того что бы удалять ядро при пересечении правой границы канвас
        for (i = 0; i < bullet_list.length; i++) {
            if (bullet_list[i].posX + bullet_list[i].size >= canvas.width)
                bullet_list.splice(i--, 1);
        }

        // проверка пересечения ядер с врагами 
        for (i = 0; i < bullet_list.length; i++) {
            for (j = 0; j < enemy_list.length; j++) {
                // проверяет коснулось ли ядро врага
                if (clash(bullet_list[i], enemy_list[j])) {
                    //если попали то увеличиваем очки на прописанную величину points
                    score += enemy_list[j].points;
                    //удаляем врага
                    enemy_list.splice(j--, 1);
                }
            }
        }

        // проверяем пересечение врагов с границей 
        for (j = 0; j < enemy_list.length; j++) {
            // если они пересекли левую  границу
            if (enemy_list[j].posX <= 0) {
                // то удаляем врага
                enemy_list.splice(j--, 1);
                // и отнимаем жизнь
                hp--;
            }
        }

        // движение 
        for (j = 0; j < enemy_list.length; j++) {
            // совершаем движение врагов с их скоростью
            enemy_list[j].posX -= enemy_list[j].speed;
        }

        // добавление врагов до предела 
        while (enemy_list.length < en_amount)
            get_enemy();
    } else {
        end_game();
    }
}

// рисуем пушку
Gun = new Class({
    draw: function(ctx) {
        with(this) {
            ctx.save()
            // translate() - установливает новую нулевую позицию по координатам (gun_x, gun_y)
            ctx.translate(gun_x, gun_y);
            // rotate - для вращения пушки
            ctx.rotate(draw_angle);
            // задаём цвет
            ctx.fillStyle = "red";
            // начинаем рисовать
            ctx.beginPath();
            ctx.arc(0, 0, 35, 2 * Math.PI, Math.PI, false);
            ctx.moveTo(15 - 50, 0);
            ctx.lineTo(30 - 50, 0 - 65);
            ctx.lineTo(70 - 50, 0 - 65);
            ctx.lineTo(85 - 50, 0);
            ctx.lineTo(15 - 50, 0);
            ctx.closePath();
            // закрашиваем нарисованое
            ctx.fill();
            // востанавливаем параметры 
            ctx.restore();
            // подставка
            // задаём цвет при перезарядке
            if (tic >= 150)
                ctx.fillStyle = 'white';
            else
                ctx.fillStyle = 'red';
            // начинаем рисовать
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.lineTo(20, canvas.height - 30);
            ctx.lineTo(80, canvas.height - 30);
            ctx.lineTo(100, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.closePath();
            ctx.fill();  
        }
    }
})

// ядро
Bullet = new Class({
    initialize: function(angle) {
        this.posX = 0;
        this.posY = 0;
        this.speed = 15; // скорость
        this.size = 5;
        this.angle = angle;
    },
    // вычисляем полёт с балистикой
    fly: function() {
        // формула балистики
        // x = x + скорость(25) * cos(45 * Math.PI / 180) / 5
        // y = x * tg(45 * Math.PI / 180) - (0,4 * x**2 / 2 *скорость(25) ** 2 * cos((45 * Math.PI / 180) ** 2))
    p1 = this.posX * Math.tan(this.angle);
    p2 = 0.4 * (this.posX ** 2);
    p3 = 2 * (this.speed ** 2) * (Math.cos(this.angle) ** 2);
    this.posY = p1 - (p2 / p3);
    this.posX += this.speed * Math.cos(this.angle) / 5;
},
draw: function(ctx) {
    // задаём цвет ядер
    ctx.fillStyle = 'red';
    // save - сохраняет все состояния и добавляет текущее состояние в стек
    ctx.save();
    // translate() - установливает новую нулевую позицию по координатам (gun_x, gun_y)
    ctx.translate(gun_x, gun_y);
    // начинаем рисовать
    ctx.beginPath();
    ctx.arc(this.posX, -this.posY, this.size + 10, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    // сохраняем состояние канваса
    ctx.restore();
    // вычисляем полёт с балистикой
    this.fly();
}
})

// враги
enemy_data = [{
    size: 200,
    speed: 2 * level / 5, // увеличение скорости с увеличением уровня
    points: 5, // количество очков за попадание
    img: en1
}, {
    size: 150,
    speed: 4 * level / 5,
    points: 10,
    img: en2
}, {
    size: 150,
    speed: 6 * level / 5,
    points: 20,
    img: en3
}, {
    size: 150,
    speed: 8 * level / 5,
    points: 40,
    img: en4
}]

Enemy = new Class({
    initialize: function(pX, pY, sz, sp, pts, im) {
        this.posX = pX; // позиция центра врага  по X
        this.posY = pY; // позиция центра врага  по Y
        this.size = sz;
        this.speed = sp;
        this.points = pts;
        this.img = im;
    },
    draw: function(ctx) {
        ctx.drawImage(this.img, this.posX - this.size / 2, canvas.height - this.posY - this.size / 2, this.size, this.size);
    },
})

// дабавление врагов
function get_enemy() {
    type = randomInt(0, 4);
    // x = длина поля + рандомное значение от 100 до 1000, для того чтобы враги лители с промежутком
    x = canvas.width + randomInt(100, 1000);
    // y = рандомное значение от 100 до (длины - 100), для разного расположения врагов по оси oy
    // первое число отвечает за ограничение снизу а второе за ограничение врагов сверху
    y = randomInt(100, canvas.height - 100);
    // берем  определенные данные врага 
    data = enemy_data[type]
    // добавляем врагов из списка по х и у раннее вычислимых и с заданными размерами, скоростью, очками и картинкой
    enemy_list.push(new Enemy(x, y, data.size, data.speed, data.points, data.img));
}

// информация (жизни и очки)
function draw_info() {
    ctx.fillStyle = 'white';
    ctx.font = "30px Arial";
    ctx.fillText(get_hp(), 10, 40);
    ctx.font = "30px Arial";
    ctx.fillText(score, 15, 70);
}

// жизни
function get_hp() {
    str = '';
    i = 0;
    while (i++ < hp) str += '❤';
    while (i++ <= 5) str += '♡';
    return str;
}

//name
function check_name() {
    firstName = prompt('Как Вас зовут?');
    if (Boolean(firstName)) {
        name = firstName;
    } else
        check_name();
}

// проверяет ли коснулось ли ядро врага
function clash(figure1, figure2) {
    clashX = false; //сначала по х и у не касается врага
    clashY = false;
    if (figure1.posX - figure2.size / 2 <= figure2.posX && figure1.posX + figure2.size / 2 >= figure2.posX) clashX = true;
    if (figure1.posY - figure2.size / 2 <= figure2.posY && figure1.posY + figure2.size / 2 >= figure2.posY) clashY = true;
    return clashX && clashY;
}

//
function end_game() {
    alert("GAME OVER");
    //сохраняем значение имя и набранные очки
    localStorage.setItem(name, score);
    // ставим игру на паузу
    change_status();
    //переносим игрока в таблицу рекордов
    change_section();
}

// выводит таблицу рекордов
function display_table() {
    // вводит имя и очки
    let html = "<table id = \"gen\"><th>ИМЯ</th><th>ОЧКИ</th>";

    for (let i = 0; i < localStorage.length && i < 20; i++) {
        html += "<tr aling=\"center\">";
        for (let j = 0; j < 1; j++) {
            // вводим в таблицу всех игроков с их очками
            let key = localStorage.key(i)
            html += "<td>" + localStorage.key(i) + "</td>";
            html += "<td>" + localStorage.getItem(key) + "</td>"
        }
        html +=

            "</tr>";
    }
    html += "</table>";

    document.getElementById("top").innerHTML = html;
}