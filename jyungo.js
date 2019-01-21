'use strict';

const BOARD_SIZE = 5;
const DECK = 25;
const direction = ["up", "left", "right", "down"];
direction["up"] = {
    y: -1,
    x: 0
}
direction["left"] = {
    y: 0,
    x: -1
}
direction["right"] = {
    y: 0,
    x: +1
}
direction["down"] = {
    y: +1,
    x: 0
}
let now_put_piece_number = 1;
let is_black_turn = true;
let selected_took_piece = false;
let select_took_piece_data = {};
let board_status_array = [];
let can_put_position_osero_rule = [];
let can_take_piece_go_rule_array = [];
//それぞれの数字の枚数の配列
let black_pieces = [0, 0, 0, 0, 0, 0];
let white_pieces = [0, 0, 0, 0, 0, 0];

function create_board_array() {
    for (let y = 0; y <= BOARD_SIZE + 1; ++y) {
        let line = [];
        for (let x = 0; x <= BOARD_SIZE + 1; ++x) {
            switch (y) {
                case 0:
                case BOARD_SIZE + 1:
                    line.push("outzone");
                    break;
                default:
                    switch (x) {
                        case 0:
                        case BOARD_SIZE + 1:
                            line.push("outzone");
                            break;
                        default:
                            line.push("space");
                            break;
                    };
            };
        };
        board_status_array.push(line);
    };
};

let clicked_board = (e) => {
    let piece_id = e.target.id || e.target.parentElement.id;
    let piece_coordinate = {
        y: parseInt(piece_id.slice(0, 1)),
        x: parseInt(piece_id.slice(2, 3))
    };

    if (board_status_array[piece_coordinate.y][piece_coordinate.x] == "space") {
        if (now_put_piece_number == DECK) {
            for (let y = 0; y < BOARD_SIZE; ++y) {
                for (let x = 0; x < BOARD_SIZE; ++x) {
                    document.getElementById((y + 1) + "_" + (x + 1)).removeEventListener("click", clicked_board, false);
                    document.getElementById((y + 1) + "_" + (x + 1)).addEventListener("click", clicked_board_no_deck, false);
                };
            };

            for (let y = 0; y < 2; ++y) {
                for (let x = 0; x < 3; ++x) {
                    if (y * 3 + x + 1 != 6) {
                        document.getElementById(`${y * 3 + x + 1}_black_storage`).addEventListener("click", select_piece_process, false);
                        document.getElementById(`${y * 3 + x + 1}_white_storage`).addEventListener("click", select_piece_process, false)
                    };
                };
            };
        };
        let now_num;

        if (now_put_piece_number % 5) {
            now_num = now_put_piece_number % 5;
        } else {
            now_num = 5;
        };
        board_status_array[piece_coordinate.y][piece_coordinate.x] = "" + now_num;
        search_enemy_osero_rule(now_num, piece_coordinate);
        search_enemy_go_rule(now_num, piece_coordinate);

        if (can_put_position_osero_rule.length) {
            take_piece_osero_rule(now_num, piece_coordinate);
        };

        if (can_take_piece_go_rule_array.length) {
            take_piece_go_rule();
        };

        ++now_put_piece_number;
        is_black_turn = !is_black_turn;
        insertion_array_data_to_board();
        insertion_array_data_to_piece_table();
    };
};

let clicked_board_no_deck = (e) => {
    let piece_id = e.target.id || e.target.parentElement.id;
    let piece_coordinate = {
        y: parseInt(piece_id.slice(0, 1)),
        x: parseInt(piece_id.slice(2, 3))
    };

    if (board_status_array[piece_coordinate.y][piece_coordinate.x] == "space" && selected_took_piece) {
        let now_num;

        if (now_put_piece_number % 5) {
            now_num = now_put_piece_number % 5;
        } else {
            now_num = 5;
        };

        if (select_took_piece_data.number == now_num) {
            if (is_black_turn && select_took_piece_data.owner == "black") {
                --black_pieces[now_num];
            } else if (!is_black_turn && select_took_piece_data.owner == "white") {
                --white_pieces[now_num];
            } else {
                alert("それは敵の駒です");
                selected_took_piece = false;
                paint_color(`${select_took_piece_data.number}_${select_took_piece_data.owner}_storage`, false);
                return;
            };

            board_status_array[piece_coordinate.y][piece_coordinate.x] = "" + now_num;
            search_enemy_osero_rule(now_num, piece_coordinate);
            search_enemy_go_rule(now_num, piece_coordinate);

            if (can_put_position_osero_rule.length) {
                take_piece_osero_rule(now_num, piece_coordinate);
            };

            if (can_take_piece_go_rule_array.length) {
                take_piece_go_rule();
            };

            ++now_put_piece_number;
            is_black_turn = !is_black_turn;
            selected_took_piece = false;
            insertion_array_data_to_board();
            insertion_array_data_to_piece_table();

            if (!check_next_turn(now_num + 1)) {
                if (is_black_turn) {
                    alert(`後手が${now_num + 1}を持っていません`);
                    alert("先手の勝ちです");
                } else {
                    alert(`先手が${now_num + 1}を持っていません`);
                    alert("後手の勝ちです");
                };
            };
        } else {
            alert(`今は${now_num}を置くターンです`);
            selected_took_piece = false;
            paint_color(`${select_took_piece_data.number}_${select_took_piece_data.owner}_storage`, false)
        };
    };
};

let select_piece_process = (e) => {
    let piece_id = e.target.id || e.target.parentElement.id;
    select_took_piece_data = {
        number: piece_id.slice(0, 1),
        owner: piece_id.slice(2, 7)
    };

    if (selected_took_piece) {
        paint_color(piece_id, false);
    } else {
        paint_color(piece_id, true);
    }
    selected_took_piece = !selected_took_piece;
};

function search_enemy_osero_rule(now_num, piece_coordinate) {
    for (let y = piece_coordinate.y - 1; y <= piece_coordinate.y + 1; ++y) {
        for (let x = piece_coordinate.x - 1; x <= piece_coordinate.x + 1; ++x) {
            let y_direction = y - piece_coordinate.y;
            let x_direction = x - piece_coordinate.x;

            if (
                board_status_array[y][x] != now_num
                && board_status_array[y][x] != "space"
                && board_status_array[y][x] != "outzone"
            ) {
                let search_position = {
                    y: y,
                    x: x
                };
                let search_array_position = board_status_array[search_position.y][search_position.x]

                while (
                    search_array_position != now_num
                    && search_array_position != "space"
                    && search_array_position != "outzone"
                ) {
                    search_position = {
                        y: search_position.y + y_direction,
                        x: search_position.x + x_direction
                    };
                    search_array_position = board_status_array[search_position.y][search_position.x]
                };

                if (board_status_array[search_position.y][search_position.x] == now_num) {
                    can_put_position_osero_rule.push(search_position);
                };
            };
        };
    };
};

function object_Calculation(piece_coordinate, direction) {
    let temp = {
        y: piece_coordinate.y + direction.y,
        x: piece_coordinate.x + direction.x
    };
    return temp;
};

function can_take_piece_go_rule(now_num, piece_coordinate, searched_position) {
    for (let i = 0; i < direction.length; ++i) {
        let position = object_Calculation(piece_coordinate, direction[direction[i]]);
        let array_position = board_status_array[position.y][position.x];
        if (array_position == "space") {
            return true;
        } else if (array_position != "outzone" && array_position != now_num) {
            let piece_id = position.y + "_" + position.x;
            if (!searched_position.includes(piece_id)) {
                searched_position.push(piece_id);
                if (can_take_piece_go_rule(now_num, position, searched_position)) {
                    return true;
                };
            };
        };
    };
    can_take_piece_go_rule_array.push(piece_coordinate);
    return false;
};

function search_enemy_go_rule(now_num, piece_coordinate) {
    let searched_position = [];
    for (let i = 0; i < direction.length; ++i) {
        let position = object_Calculation(piece_coordinate, direction[direction[i]]);
        let array_position = board_status_array[position.y][position.x];
        if (array_position != "space" && array_position != "outzone" && array_position != now_num) {
            searched_position.push(position.y + "_" + position.x)
            if (can_take_piece_go_rule(now_num, position, searched_position)) {
                can_take_piece_go_rule_array = [];
            };
        };
    };
};

//https://www.deep-rain.com/programming/javascript/755
function objectSort(obj) {
    // まずキーのみをソートする
    var keys = Object.keys(obj).sort();

    // 返却する空のオブジェクトを作る
    var map = {};

    // ソート済みのキー順に返却用のオブジェクトに値を格納する
    keys.forEach(function (key) {
        map[key] = obj[key];
    });

    return map;
};

function take_piece_osero_rule(now_num, piece_coordinate) {
    for (let i = 0; i < can_put_position_osero_rule.length; ++i) {
        let y_direction = (can_put_position_osero_rule[i].y - piece_coordinate.y) / Math.abs(can_put_position_osero_rule[i].y - piece_coordinate.y);
        let x_direction = (can_put_position_osero_rule[i].x - piece_coordinate.x) / Math.abs(can_put_position_osero_rule[i].x - piece_coordinate.x);
        let take_piece_position = {
            x: piece_coordinate.x,
            y: piece_coordinate.y
        };

        while (!(JSON.stringify(objectSort(can_put_position_osero_rule[i])) === JSON.stringify(objectSort(take_piece_position)))) {
            let take_piece = board_status_array[take_piece_position.y][take_piece_position.x];
            if (now_num != take_piece) {
                if (is_black_turn) {
                    ++black_pieces[parseInt(take_piece)];
                    board_status_array[take_piece_position.y][take_piece_position.x] = "space";
                } else {
                    ++white_pieces[parseInt(take_piece)];
                    board_status_array[take_piece_position.y][take_piece_position.x] = "space";
                };
            };

            if (y_direction) {
                take_piece_position.y += y_direction;
            } else {
                take_piece_position.y += 0;
            };

            if (x_direction) {
                take_piece_position.x += x_direction;
            } else {
                take_piece_position.x += 0;
            };
        };
    };
    can_put_position_osero_rule = [];
};

function take_piece_go_rule() {
    for (let i = 0; i < can_take_piece_go_rule_array.length; ++i) {
        let position = {
            y: can_take_piece_go_rule_array[i].y,
            x: can_take_piece_go_rule_array[i].x
        };
        if (board_status_array[position.y][position.x] != "space") {
            if (is_black_turn) {
                ++white_pieces[parseInt(board_status_array[position.y][position.x])];
                board_status_array[position.y][position.x] = "space";
            } else {
                ++white_pieces[parseInt(board_status_array[position.y][position.x])];
                board_status_array[position.y][position.x] = "space";
            };
        };
    };
};

function check_next_turn(next_num) {
    if (is_black_turn) {
        return black_pieces[next_num];
    } else {
        return white_pieces[next_num];
    };
};

function paint_color(id, paint) {
    if (paint) {
        document.getElementById(id).style.backgroundColor = "red";
    } else {
        document.getElementById(id).style.backgroundColor = "rgba(0,0,0,0)"
    };
};

function insertion_array_data_to_board() {
    for (let y = 1; y <= BOARD_SIZE; ++y) {
        for (let x = 1; x <= BOARD_SIZE; ++x) {
            let now_board_position = document.getElementById(y + "_" + x);
            if (!(now_board_position.children.length)) {
                if (board_status_array[y][x] !== "space") {
                    let html_img = document.createElement("img");

                    html_img.src = "number_" + board_status_array[y][x] + ".png";
                    now_board_position.appendChild(html_img);
                };
            } else {
                if (board_status_array[y][x] === "space") {
                    now_board_position.removeChild(now_board_position.firstChild);
                };
            };
        };
    };
};

function insertion_array_data_to_piece_table() {
    for (let y = 0; y < 2; ++y) {
        for (let x = 0; x < 3; ++x) {
            if (y * 3 + x + 1 != 6) {
                document.getElementById(`${y * 3 + x + 1}_black_storage`).lastChild.innerHTML = black_pieces[y * 3 + x + 1];
                document.getElementById(`${y * 3 + x + 1}_white_storage`).lastChild.innerHTML = white_pieces[y * 3 + x + 1];
            };
        };
    };
};

function create_board() {
    for (let y = 0; y < BOARD_SIZE; ++y) {
        let html_tr = document.createElement("tr");
        board.appendChild(html_tr);

        for (let x = 0; x < BOARD_SIZE; ++x) {
            let html_td = document.createElement("td");

            html_td.addEventListener("click", clicked_board, false);
            html_td.id = (y + 1) + "_" + (x + 1);
            html_tr.appendChild(html_td);
        };
    };
};


function create_piece_table() {
    for (let y = 0; y < 2; ++y) {

        let html_tr_black = document.createElement("tr");
        let html_tr_white = document.createElement("tr");

        for (let x = 0; x < 3; ++x) {
            if (y * 3 + x + 1 != 6) {
                let html_td_black = document.createElement("td");
                let html_td_white = document.createElement("td");
                let html_p_black = document.createElement("p");
                let html_p_white = document.createElement("p");
                let html_img_black = document.createElement("img");
                let html_img_white = document.createElement("img");

                html_td_black.id = `${y * 3 + x + 1}_black_storage`;
                html_td_white.id = `${y * 3 + x + 1}_white_storage`;
                //html_td.addEventListener("click", took_piece_selecte_process, false);
                html_img_black.src = `number_${y * 3 + x + 1}.png`;
                html_img_white.src = `number_${y * 3 + x + 1}.png`;
                html_p_black.innerHTML = "0";
                html_p_white.innerHTML = "0";
                html_td_black.appendChild(html_img_black);
                html_td_white.appendChild(html_img_white);

                html_td_black.appendChild(html_p_black);
                html_td_white.appendChild(html_p_white);
                html_tr_black.appendChild(html_td_black);
                html_tr_white.appendChild(html_td_white);
            };
        };
        black_piece_table.appendChild(html_tr_black);
        white_piece_table.appendChild(html_tr_white);
    };
};

create_board_array();
create_board();
create_piece_table();