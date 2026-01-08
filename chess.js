let class_x = document.querySelector('.x'); // это шахматная доска
let block; // в конце будет равен последнему элементу из 64-х. те с порядковым номером 88. в цикле инициализации меняется 64-1=63 раза
let flag_for_cell = true;
const grow = 11; //для создания сетки классов 64м квадратам. начало с координат (1;1)
let motion = true; //первый ход за белыми, поэтому тру стоит. false значение для хода тьмы 
let flag_pickup = false; //флаг подхвата. Если нажать на фигуру хозяина хода, а потом отвести мышь, то Еп (потенциальные ходы) останутся включены, чтобы его сбросить нужно нажать somewhere. флаг равен true когда что-то выбрано
let flag_for_conversion = false; // флаг для превращения пешки во что-то, if true, то ща фаза превращение пешки во что-то
let memory_for_conversion = 0; // запоминается номер фигуры убитой на поляне для рокировки, шоб обработчик события клавы знал где осуществлять превращение
let for_changes = document.querySelector('.for_changes');
for_changes.style.display = 'none';
let notificationContainer = document.querySelector('.notification_container');
const btnQ = document.querySelector('.conversion_q');
const btnS = document.querySelector('.conversion_s');
const triggerConversion = (keyCode) => {
    // Вызываем вашу существующую функцию, передавая объект похожий на event
    func_handler_conversion_pawn_into({ which: keyCode });
};

// Вешаем клики
if (btnQ) {
    btnQ.onclick = () => triggerConversion(81); // 81 — это код клавиши Q
}

if (btnS) {
    btnS.onclick = () => triggerConversion(83); // 83 — это код клавиши S
}


//
// появление доски раз и навсегда
(function AppearingBoard () {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (j == 0) flag_for_cell = !flag_for_cell;
            let block = document.createElement('div'); // добавил let, чтобы не было глобальной переменной
            
            // Оставляем ваши классы, они хорошие
            block.className = flag_for_cell ? "block black for_flex__GG__WP" : "block white for_flex__GG__WP";
            
            // Ваша логика координат (рост +10 и +1) сохраняется
            block.classList.add(grow + j * 10 + i); 
            
            block.appendChild(document.createElement('img'));
            class_x.appendChild(block);
            flag_for_cell = !flag_for_cell;
        }
    }
})();
// 
//



//
// функции прозрачности
let func_opacity0 = function (x){ //передаваемому аргументу ставит прозрачность 0%
    x.classList.remove("opacity1");
    x.classList.add("opacity0");
};
let func_opacity1 = function (x){ //передаваемому аргументу ставит прозрачность 100%
    x.classList.remove("opacity0");  
    x.classList.add("opacity1");
};
//
//

//
//
let func_switch_motion = function (){ // для свича хода
motion=!motion;
};
//
//


//
// функции подготовки к ходу
let func_remove_all_ready = function (){  // вызывается перед всеми событиями, чтобы не было накладок потенциальных (Еп) ходов 
Array.from(class_x.children).forEach( (item) => {
item.children[0].classList.remove("ready_finish");
item.children[0].classList.remove("ready_start");
item.children[0].classList.remove("can_pick");
item.children[0].classList.remove("can_attack");

});    
};
let func_shell_ready = function (x){ //x- это соответствующая функция реади. Сама функция весит на кликах, кроме пустоты
return function (){      //именно эта тема будет вызываться ивентом клика
    if (this.classList.contains("ready_finish") && flag_pickup){ // если именно эта фигура содержит класс реади финиш, то будет свап с фигурой содержащей реади старт

        if (func_search_replacement()?.children[0].classList.contains("pawn") && (this?.parentElement.classList[3][1]=== "1" ? true : this?.parentElement.classList[3][1]=== "8") ){
        memory_for_conversion = +this?.parentElement.classList[3];
        func_conversion_pawn_into(); 
        func_change_with_ready_start(this); //motion уже изменилось в тексте этой функции, то что ниже - это уже ход другого игрока
        flag_pickup = false;
        func_remove_all_ready();
        console.log("текст функции кого убили ",x); //функция того, кого убили (текст)
        console.log("сама убитая img ",this); //именно сама img, которую съели

        }else{
            
        func_change_with_ready_start(this); //motion уже изменилось в тексте этой функции, то что ниже - это уже ход другого игрока
        console.log("текст функции кого убили ",x); //функция того, кого убили (текст)
        console.log("сама убитая img ",this); //именно сама img, которую съели
        flag_pickup = false;
        func_remove_all_ready();
        func_troubleshooting_for_king(); // need чтобы сбивался варик рокировки при ШАХе королю при наступлении на пустоту
        }

    }else{ // если был клик не на слот с классом ready_finish, то будет сброс классов реди и выполнится переустановка классов реди для нажатой фигуры (её варианты ходы появятся)

    let isMyPiece = (motion && this.classList.contains("sentinel")) || (!motion && this.classList.contains("scourge"));

            if (isMyPiece) {
                func_remove_all_ready();
                flag_pickup = false;
                x.bind(this)(); // Запускаем показ ходов
                flag_pickup = true; // Теперь ховеры заблочены правильно (своя фигура выбрана)
            } else {
                // Если нажали на врага (не для удара) или просто мимо
                func_remove_all_ready();
                flag_pickup = false; // Снимаем блок ховеров
            }
    }
}
};
let func_setup_ready = function(x){ //x - должен быть div, тк класс ready_finish вешается на img
x?.children[0].classList.add("ready_finish");
x?.children[0].classList.add("can_attack");
};
let func_delete_ready = function(x){ //x - это div, c его img удаляется реади финиш класс
x?.children[0].classList.remove("ready_finish");
};
let func_remove_opportunity_to_castle = function (){  // если ход белых, то ремув у белых класс рокировки, если чёрных, то у них
    Array.from(class_x.children).forEach( (item) => {
        if (item.children[0].classList[1]==="sentinel" && motion){
            item.children[0].classList.remove("for_castling");
        }
        if (item.children[0].classList[1]==="scourge" && !motion){
            item.children[0].classList.remove("for_castling");
        }
        });    
};
let func_conversion_pawn_into = function () {  // вызывается при наступлении пешки на граничные клеточки, далее будет превращение
    flag_for_conversion = true;
    for_changes.style.display = 'block';
    for_changes.textContent = 'Please press "Q" or "S" button to conversion pawn';

    if (notificationContainer) {
        notificationContainer.classList.add('show_conversion');
    }
};
let func_handler_conversion_pawn_into = function (event) {
    if (flag_for_conversion) {
        // Проверяем нажатие именно Q (81) или S (83)
        if (event.which == 81 || event.which == 83) {
            
            // Прячем текст
            for_changes.style.display = 'none';
            
            // УДАЛЯЕМ КЛАСС У РОДИТЕЛЯ (скрываем квадратики Q и S)
            if (notificationContainer) {
                notificationContainer.classList.remove('show_conversion');
            }

            if (event.which == 81) {
                console.log("Замена на ферзя");
                if (motion) {
                    func_appointment_queen_scourge(func_search_img_by_num(memory_for_conversion));
                } else {
                    func_appointment_queen_sentinel(func_search_img_by_num(memory_for_conversion));
                }
            } else if (event.which == 83) {
                console.log("Замена на коня");
                if (motion) {
                    func_appointment_steed_scourge(func_search_img_by_num(memory_for_conversion));
                } else {
                    func_appointment_steed_sentinel(func_search_img_by_num(memory_for_conversion));
                }
            }
            
            flag_for_conversion = false;
            func_troubleshooting_for_king();
        }
    }
};
let func_search_kings = function(){ //ищет div короля в зависимости от того, чей щас ход и возвращает его
return Array.from(class_x.children).find(function(item){             
    if (motion){
        return (item.children[0].classList.contains("king") && item.children[0].classList.contains("sentinel"));
    }else {
        return (item.children[0].classList.contains("king") && item.children[0].classList.contains("scourge"));
    }
})
};
let func_troubleshooting_for_king = function(){ //ищет угрозу королю, если есть, то ретурт тру (Рассматривается вопрос о том, можно ли её законтрить). Also удаляет возможность рокироваться, удаляя класс рокировки
    if (!func_search_threats(+func_search_kings().classList[3], +func_search_kings().classList[3]) === true){
        func_remove_opportunity_to_castle();
        for_changes.style.display = 'block';
        for_changes.textContent = 'CHECK';
        console.log("Знай, что случился ШАХ");

        // есть ли решение ШАХ-а ? если нет, то МАТ
        let inner_arr = Array.from(class_x.children).filter(function(item){
            return (item.children[0].classList.contains(`${motion===true? "sentinel": "scourge"}`) === true); // возвращает массив с элемами div, которые принадлежат одной фракции и будут чекаться.
        }).map( (item)=>{
            if(item.children[0].classList.contains("pawn")){ // если имг содержит класс пешки, то motion_pawn запул
                let for_pawn = func_pawn_motion(func_search_num_by_div(item), true);  //num цифра от 11 до 88 
                func_pawn_motion(func_search_num_by_div(item), false); // чтобы удалить за собой классы реади 'абы где' появившиеся
                if(!for_pawn.includes(true)){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ ПЕШКИ', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ ПЕШКИ', item);
                    return true;
                }
            }
            if(item.children[0].classList.contains("queen")){
            let for_diagonal = func_diagonal_motion(func_search_num_by_div(item), true);    
            let for_erect = func_erect_motion(func_search_num_by_div(item), true);
            func_diagonal_motion(func_search_num_by_div(item), false);
            func_erect_motion(func_search_num_by_div(item), false);
                if(!for_diagonal.includes(true) && !for_erect.includes(true) ){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ КОРОЛЕВЫ', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ КОРОЛЕВЫ');
                    return true;
                }
            }
            if(item.children[0].classList.contains("rook")){
                let for_rook = func_erect_motion(func_search_num_by_div(item), true);
                func_erect_motion(func_search_num_by_div(item), false);
                if(!for_rook.includes(true)){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ ТУРЫ', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ ТУРЫ', item);
                    return true;
                }
            }
            if(item.children[0].classList.contains("officer")){
                let for_officer = func_diagonal_motion(func_search_num_by_div(item), true);
                func_diagonal_motion(func_search_num_by_div(item), false);
                if(!for_officer.includes(true)){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ ОФИЦЕРА', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ ОФИЦЕРА', item);
                    return true;
                }
            }
            if(item.children[0].classList.contains("steed")){
                let for_steed = func_steed_motion(func_search_num_by_div(item), true);
                func_steed_motion(func_search_num_by_div(item), false);
                if(!for_steed.includes(true)){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ КОНЯ', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ КОНЯ', item);
                    return true;
                }
            }
            if(item.children[0].classList.contains("troll" && "king")){
                let for_king_or_troll = func_royal_move_motion(func_search_num_by_div(item), true);
                func_royal_move_motion(func_search_num_by_div(item), false);
                if(!for_king_or_troll.includes(true)){  // если в массиве нету true, те нету вариантов потенциальных ходов, то ниже ...
                    console.log('НЕТУ ВАРИАНТОВ ДЛЯ КОРОЛЯ или ТРОЛЯ', item);
                    return false;
                }else{
                    console.log('ЕСТЬ ВАРИКИ ДЛЯ КОРОЛЯ или ТРОЛЯ', item);
                    return true;
                }
            }
        });
        if (!inner_arr.includes(true)){  // если массив вариков не содержит true, что = отсутствию решения ШАХ, то наступил МАТ
            for_changes.style.display = 'block';
            for_changes.textContent = `Победа за ${!motion===true? "СВЕТОМ ": "ТЬМОЙ "}!!!`;
        }
        console.log(inner_arr);
    }else{
        for_changes.style.display = 'none';
    };
    return  !func_search_threats(+func_search_kings().classList[3], +func_search_kings().classList[3]);
};
let func_search_threats = function (num, x, not_king, where_not_king_will_go){  // (КТО-КУДА,КТО-КУДА) будет чекать угрозы для переданного Х (икса) div-a, чаще всего div-у Х=короля. NUM - тот, кто ходить хочет (король) X - то, куда станет - ЖЕЛАНИЕ
// Если передать x=num=королю и rest параметры undef, то будет чекать опасности для короля. Если передать x!=num короля и rest параметры другой фигуры разными, то будет чек на ШАХ при ходе другой фигуры
let side = func_search_element_by_num(num).children[0].classList[1]; // string = сенты либо скордж в зависимости от хода

let i = 0;                                                // i должно ресататься в 0 после каждого вызова функции чека опасности по переменным ниже
// направления УГРОЗ ниже. Сравнения нужны, чтобы номер (цифра) на выходе была разная, чтобы не был учёт где стоит передвигаемая фигура
let ilower = (i=0)=>{return x+1+i+        +( Math.abs(num-x)===1 && num>x);   };      //вперёд ====================== чек на туру, короля, троля и даму 
let iupper = (i=0)=>{return x-1-i-        +( Math.abs(num-x)===1 && x>num);   };      //назад ======================= чек на туру, короля, троля и даму 
let iright = (i=0)=>{return x+10*(1+i+    +( Math.abs(num-x)===10 && num>x)); };      //вправо ====================== чек на туру, короля, троля и даму 
let ileft  = (i=0)=>{return x-10*(1+i+    +( Math.abs(num-x)===10 && x>num)); };      //влево ======================= чек на туру, короля, троля и даму 
let degree45 = (i=0)=>{return x+9*(1+i+   +( Math.abs(num-x)===9 && num>x));  };      //вверх и вправо - диагональ == чек на пешку, офицера и даму
let degree135 = (i=0)=>{return x+11*(1+i+ +( Math.abs(num-x)===11 && num>x)); };      //вниз и вправо - диагональ === чек на пешку, офицера и даму
let degree225 = (i=0)=>{return x-9*(1+i+  +( Math.abs(num-x)===9 && x>num));  };      //вниз и влево - диагональ ==== чек на пешку, офицера и даму
let degree315 = (i=0)=>{return x-11*(1+i+ +( Math.abs(num-x)===11 && x>num)); };      //вверх и влево - диагональ === чек на пешку, офицера и даму
let ierect_left =  x-12;                       //прямо и влево - конь ======== чек на коня
let ierect_right =  x+8;                       //прямо и вправо - конь ======= чек на коня
let back_left =  x-8;                          //вниз и влево - конь ========= чек на коня
let back_right =  x+12;                        //вниз и вправо - конь ======== чек на коня
let left_ierect =  x-21;                       //влево и прямо - конь ======== чек на коня
let left_back =  x-19;                         //влево и вниз - конь ========= чек на коня
let right_ierect =  x+19;                      //вправо и прямо - конь ======= чек на коня
let right_back =  x+21;                        //вправо и вниз - конь ======== чек на коня
let func_for_straight_and_diagonal = function (y, arr_once, arr_by_cooldown){         //y - это функция, вызов которой ретурник цифру Еп угрозы
    i=0;
if(!func_search_element_by_num(y())){
    return true;
}else{ // У(0) не существует
    if(func_search_element_by_num(y()).children[0].classList[0]==="pawn" && side!==func_search_element_by_num(y()).children[0].classList[1]){ // y(0) - это пешка и не союзник. Если у(0) пустота, тогда не пройдёт, тк не пешка
        if(side==="sentinel"){

            if(y()+11===x || y()-9===x){  
                if(y()===where_not_king_will_go){
                    return true;} // ходя королём, допуск получить в этот блок невозможно, тк Z2 = null
                return false;             
            }else{
                return true;}
        }else{

            if(y()+9===x || y()-11===x){
                if(y()===where_not_king_will_go){
                    return true;} // ходя королём, допуск получить в этот блок невозможно, тк Z2 = null
                return false;
            }else{
                return true;
            }
        }
    }; // с пешкой покончено и у(0) существует


    if(arr_once.includes(func_search_element_by_num(y())?.children[0].classList[0]) && side!==func_search_element_by_num(y()).children[0].classList[1]){ // y(0) - это херь из массива и эти кенты злые (тролль, король)
        if(y()===where_not_king_will_go){
            return true;} // ходя королём, допуск получить в этот блок невозможно, тк Z2 = null
        return false;
    }; // с массивом покончено и у(0) существует

return (function inner (){
    if(!func_search_element_by_num(y(i))){
        return true; //y(i) не существует
    }else{           //y(i) существует
        if(func_search_element_by_num(y(i)).children[0].classList[1]==="opacity0"){ // y(i) - это empty
            if(y(i)===where_not_king_will_go){
                return true;}
            i = i+1;
            return inner();
        } // с пустотой покончено и y(i) существует

        if(side===func_search_element_by_num(y(i)).children[0].classList[1]){ // y(i) - это союзник же
            if(y(i)===not_king){                                   // y(i) - это союзник, который хочет уйти?
                i = i+1;
                return inner();                                    // тогда need некст проверка рекурсионно
            }
            return true;
        } // с союзником покончено и y(i) существует

        if(arr_by_cooldown.includes(func_search_element_by_num(y(i)).children[0].classList[0]) && side!==func_search_element_by_num(y(i)).children[0].classList[1]){ // y(i) - это херь из массива и эти кенты злые (дама, тура, офицер)
            if(y(i)===where_not_king_will_go){ // y(i) намечается удар в голову, угроза может быть устранена не королём
                return true;
            }
            return false;
        } // с массивом дамы, офицера и туры покончено

        if(func_search_element_by_num(y(i)).children[0].classList[1]!=="opacity0" && side!==func_search_element_by_num(y(i)).children[0].classList[1]){
            return true;
        }
    }
    
})();    

}; 
};
let func_for_steed = function (y){
i=0;
if( side!==func_search_element_by_num(y)?.children[0].classList[1] && func_search_element_by_num(y)?.children[0].classList[0]==="steed" ){
    if(y===where_not_king_will_go){
        return true;}
    return false;
}else{
    return true; 
}
};

if (
func_for_straight_and_diagonal(ilower, ["troll", "king"], ["rook","queen"]) && 
func_for_straight_and_diagonal(iupper, ["troll", "king"], ["rook","queen"]) &&
func_for_straight_and_diagonal(iright, ["troll", "king"], ["rook","queen"]) && 
func_for_straight_and_diagonal(ileft,  ["troll", "king"], ["rook","queen"]) &&
func_for_straight_and_diagonal(degree45,  ["troll", "king"], ["officer","queen"]) && 
func_for_straight_and_diagonal(degree135, ["troll", "king"], ["officer","queen"]) &&
func_for_straight_and_diagonal(degree225, ["troll", "king"], ["officer","queen"]) && 
func_for_straight_and_diagonal(degree315, ["troll", "king"], ["officer","queen"]) &&

func_for_steed(ierect_left) && 
func_for_steed(ierect_right) && 
func_for_steed(back_left) && 
func_for_steed(back_right) && 
func_for_steed(left_ierect) && 
func_for_steed(left_back) && 
func_for_steed(right_ierect) && 
func_for_steed(right_back) 
){
    console.log("tyt true, Значит ШАХа нету aka угрозы нету ");
    return true;
}else{

    console.log("tyt false, значит король под ШАХОМ aka есть угроза");
    return false}
};
let func_search_side = function (side){                                                  // Принимает номер фигуры, выдаёт её сторону стрингой в зависимости от хода. 
    return func_search_element_by_num(side)?.children[0].classList[1];
};
let func_search_element_by_num = function(x){ // принимает цифру класса искомого элемента div и возвращает сам div
return Array.from(class_x.children).find((item) => { 
return +item.classList[3] === x;                     
});                                               
};
let func_search_num_by_img = function (x){ // x  - img, return number
return +x.parentElement.classList[3];
};
let func_search_num_by_div = function (x) { // x - div, return number
return +x.classList[3];
};
let func_search_img_by_num = function (x){ // x - num, return - img
    return func_search_element_by_num(x)?.children[0];
};
let func_search_replacement = function () { // возвращает div, img которого имеет класс реди старт
return Array.from(class_x.children).find( (item) => {
return item.children[0].classList.contains("ready_start")
});
};
let func_change_with_ready_start = function (x){ // x (img) - это то, куда перемистится финиш реади методом ЗАМЕНЫ, те Х будет потерян
    let for_reservation = func_search_replacement(); 
    let img = document.createElement('img');
    for_reservation.children[0].classList.remove("pawn_first_step"); // НЕ ПОМЕШАЕТ ЛИ ДРУГИМ
    for_reservation.children[0].classList.remove("for_castling");    // УДАЛЕНИЕ КЛАССА РОКИРОВКИ
    x.replaceWith(for_reservation.children[0]); // img switch na img методом КИК-а. Х умирает
    for_reservation.append(img); // вставить в пустоту div-a пока что пустую имг новосозданную
    func_appointment_empty(img); // сделать имгшку не пустой, а наполненной
    func_switch_motion();
}
//
//

//
//
let func_erect_motion = function (num, bull){ // num - это номер фигуры, которая ходить будет. bull - если тру, то реди, если фолс, то анреди
    
let array_of_possibilities = []; // если в массиве содержится хотябы 1 значение true, значит возможности имеются. возвращение этой штуки нид для поиска МАТа 
let i = 0;
let ilower = ()=>{return num-1-i;};
let iupper = ()=>{return num+1+i;};
let iright = ()=>{return num-10*(1+i);};
let ileft  = ()=>{return num+10*(1+i);};
let func_directions_outside_prom = async function (x){
    (func_directions_inside = function(){
if(!!func_search_element_by_num(x()) && !func_search_element_by_num(x())?.children[0].hasAttribute("src") &&  bull){ // на mouseover. Тут чекается на пустоту, если пусто (те нету src), то можно ходить на эту клеточку
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){  //в ШАХ не становишься? х =Еп, num - кто ходит
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
            i++;
            func_directions_inside(); 
}else{
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("scourge") && motion && bull){  // это враг сентов, сейчас ход сентов, сейчас реади функция запущена и элемент существует?
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){  //в ШАХ не становишься? х =Еп, num - кто ходит
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);  
    }else{
        array_of_possibilities.push(false);
    };
}
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("sentinel") && !motion && bull){ // это враг скорджа, ща ход тьмы, реади функция и элем существует?
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){  //в ШАХ не становишься? х =Еп, num - кто ходит
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);  
    }else{
        array_of_possibilities.push(false);
    };
}
}
if(!!func_search_element_by_num(x()) && !func_search_element_by_num(x())?.children[0].hasAttribute("src") && !bull){ // на mouseout из-за bull
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
            i++;
            func_directions_inside(); 
}else{
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("scourge") && motion && !bull){
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
}
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("sentinel") && !motion && !bull){
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
}
}
})();
            i=0;
};
func_directions_outside_prom(ilower).then(func_directions_outside_prom(iupper)).then(func_directions_outside_prom(iright)).then(func_directions_outside_prom(ileft));
return array_of_possibilities;
};
let func_diagonal_motion = function (num, bull){

    let array_of_possibilities = [];
    let i = 0;
let degree45 = ()=>{return num+9*(1+i)};
let degree135 = ()=>{return num+11*(1+i)};
let degree225 = ()=>{return num-9*(1+i)};
let degree315 = ()=>{return num-11*(1+i)};
let func_directions_outside_prom = async function(x){
    (func_directions_inside = function(){
if(!!func_search_element_by_num(x()) && !func_search_element_by_num(x())?.children[0].hasAttribute("src") &&  bull){ // на mouseover. Тут чекается на пустоту, если пусто (те нету src), то можно ходить на эту клеточку 
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
        i++;
        func_directions_inside(); 
}else{
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("scourge") && motion && bull){    
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
}
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("sentinel") && !motion && bull){
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x()])){
        func_setup_ready(func_search_element_by_num(x()))
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
}
}
if(!!func_search_element_by_num(x()) && !func_search_element_by_num(x())?.children[0].hasAttribute("src") && !bull){ // на mouseout из-за bull
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
        i++;
        func_directions_inside(); 
}else{
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("scourge") && motion && !bull){
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
}
if(!!func_search_element_by_num(x()) && func_search_element_by_num(x()).children[0].classList.contains("sentinel") && !motion && !bull){
    func_search_element_by_num(x())?.children[0].classList.remove("ready_finish");
}
}
})();
        i=0;
};

func_directions_outside_prom(degree45).then(func_directions_outside_prom(degree135)).then(func_directions_outside_prom(degree225)).then(func_directions_outside_prom(degree315));
return array_of_possibilities;
};
let func_pawn_motion = function (num, bull){ // num - это номер фигуры, которая ходить будет. bull - если тру, то реди, если фолс, то анреди

let array_of_possibilities = [];
let ierect, ileft, iright, idoubleerect;
if(motion===true){  // в зависимости от стороны (свет или тьма) пешка бьёт в разных направлениях
ierect = num-1;
ileft = num-11;
iright = num+9;
idoubleerect  = num-2;
}else{
ierect = num+1;
ileft = num-9;
iright = num+11;
idoubleerect  = num+2;
};
let func_directions_outside_prom = async function (x){
(func_directions_inside = function(){
if(!!func_search_element_by_num(x) && !func_search_element_by_num(x)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(x) && x!==ileft && x!==iright && bull){ 
    // Еп существует, Еп не имеет src => это эмпти, Еп не союзник передвигаемой пешки, ход прямо. 
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x])){
        func_setup_ready(func_search_element_by_num(x));
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
if(func_search_element_by_num(num).children[0].classList.contains("pawn_first_step") && !func_search_element_by_num(idoubleerect)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(idoubleerect)){          
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, idoubleerect])){
        func_setup_ready(func_search_element_by_num(idoubleerect));
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
}
}else if(!!func_search_element_by_num(x) && !!func_search_element_by_num(x)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(x) && x!==ierect && bull){ 
    // ELSE => left и right, Еп существует, Еп не союзник передвигаемой пешки, Еп имеет src, ход не прямо
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x])){
        func_setup_ready(func_search_element_by_num(x));
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
}
if(!!func_search_element_by_num(x) && !func_search_element_by_num(x)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(x) && x!==ileft && x!==iright && !bull){ // SAME, но для анреади, bull в проёбе
    func_search_element_by_num(x)?.children[0].classList.remove("ready_finish");
if(func_search_element_by_num(num).children[0].classList.contains("pawn_first_step") && !func_search_element_by_num(idoubleerect)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(idoubleerect)){          
    func_search_element_by_num(idoubleerect)?.children[0].classList.remove("ready_finish");
}
}else if(!!func_search_element_by_num(x) && !!func_search_element_by_num(x)?.children[0].hasAttribute("src") && func_search_side(num)!==func_search_side(x) && x!==ierect && !bull){ 
    func_search_element_by_num(x)?.children[0].classList.remove("ready_finish");
}
})();
};
func_directions_outside_prom(ierect).then(func_directions_outside_prom(ileft)).then(func_directions_outside_prom(iright));
return array_of_possibilities;
};
let func_steed_motion = function (num, bull){

let array_of_possibilities = [];
let ierect_left = num-12;
let ierect_right = num+8;
let back_left = num-8;
let back_right = num+12;
let left_ierect = num-21;
let left_back = num-19;
let right_ierect = num+19;
let right_back = num+21;
let func_directions_outside_prom = async function (x){
    (func_directions_inside = function(){
if(!!func_search_element_by_num(x) && func_search_element_by_num(num).children[0].classList[1]!==func_search_element_by_num(x)?.children[0].classList[1] && bull){
    if(func_search_threats.apply(null, [+func_search_kings().classList[3], +func_search_kings().classList[3], num, x])){
        func_setup_ready(func_search_element_by_num(x));
        array_of_possibilities.push(true);
    }else{
        array_of_possibilities.push(false);
    };
}
if(!!func_search_element_by_num(x) && func_search_element_by_num(num).children[0].classList[1]!==func_search_element_by_num(x)?.children[0].classList[1] && !bull){
    func_search_element_by_num(x)?.children[0].classList.remove("ready_finish");
}
})();
}
func_directions_outside_prom(ierect_left)
.then(func_directions_outside_prom(ierect_right))
.then(func_directions_outside_prom(back_left))
.then(func_directions_outside_prom(back_right))
.then(func_directions_outside_prom(left_ierect))
.then(func_directions_outside_prom(left_back))
.then(func_directions_outside_prom(right_ierect))
.then(func_directions_outside_prom(right_back));
return array_of_possibilities;
};
let func_royal_move_motion = function (num, bull){ //для короля и тролля. Num - это место, где стоит фигура, которая будет ходить в формате цифра

    let array_of_possibilities = [];
    let ierect_left = num-11, 
    ierect_right = num+9, 
    back_left = num-9, 
    back_right = num+11, 
    ierect = num-1;
    back = num+1;
    left = num-10;
    right = num+10;
    let func_directions_outside_prom = async function (x){  // x - число из div-a, куда будет ходить фигура (один из вариков), нажатая мышкой
        (func_directions_inside = function(){
    if(!!func_search_element_by_num(x) && func_search_element_by_num(num)?.children[0].classList[1]!==func_search_element_by_num(x)?.children[0].classList[1] && bull){ //такая клетка существует? Еп враг? реади? 
        if(func_search_threats.apply(null, [num,x, null, null])){  //в ШАХ не становишься? х =Еп, num - кто ходит
            func_setup_ready(func_search_element_by_num(x))
            array_of_possibilities.push(true);
        }else{
            array_of_possibilities.push(false);
        };
    }
    if(!!func_search_element_by_num(x) && func_search_element_by_num(num)?.children[0].classList[1]!==func_search_element_by_num(x)?.children[0].classList[1] && !bull){
        func_search_element_by_num(x)?.children[0].classList.remove("ready_finish");
    }
    })();
    };


    let func_direction_to_castling = async function (direction_for_castling){ // x - направление рокировки. if x = 2, то рокировка вправо, if x = -2, то рокировка влево

        let direction = (direction_for_castling===2? 10 : direction_for_castling===-2? -10: undefined); // = 10 либо -10. В зависимости от direction_for_castling
        let distance_to_rook = (direction_for_castling === 2? 30: direction_for_castling=== -2 ? -40: undefined); // расстояние до туры включая. = +30 либо -40
        let rest = (distance_to_rook === 30? 2: distance_to_rook === -40? 3: undefined); // количество клеток подлежащих проверки на чистоту и безопасность

        if (func_search_img_by_num(num + distance_to_rook)?.classList.contains("for_castling") && func_search_img_by_num(num).classList.contains("for_castling")){ // есть ли класс рокировки у интересующей туры и короля
        
            function func_search_threats_for_castling () {
            if(rest!==0){ // если все шаги сделаны и они безопасны, то можно ступать королю на самую дальнюю клетку со свапом rook-a
            if(func_search_img_by_num( num + direction * ( (Math.abs(distance_to_rook)/10) - rest ) ).classList.contains("empty")){  // для каждого шага начиная с первого. IMG-ка очередная чекается сперва на пустоту, затем есть смысл искать угрозы
            if(func_search_threats.apply(null, [num, num + direction * ( (Math.abs(distance_to_rook)/10) - rest ), null, null])){   
                
                rest = rest - 1;                     // рекурсия 
                func_search_threats_for_castling();  // рекурсия 
            };
        }
            }else{ 
                if(bull){
                    func_setup_ready(func_search_element_by_num(num + direction_for_castling*10));
                }
                if(!bull){
                    func_search_element_by_num(num + direction_for_castling*10)?.children[0].classList.remove("ready_finish");
                }
                } // если все шаги сделаны и они безопасны, то можно ступать королю на самую дальнюю клетку со свапом туры 
        };
        func_search_threats_for_castling ();
    }  
    };
    func_directions_outside_prom(ierect_left)
    .then(func_directions_outside_prom(ierect_right))
    .then(func_directions_outside_prom(back_left))
    .then(func_directions_outside_prom(back_right))
    .then(func_directions_outside_prom(ierect))
    .then(func_directions_outside_prom(back))
    .then(func_directions_outside_prom(left))
    .then(func_directions_outside_prom(right))
    .then(func_direction_to_castling(2))
    .then(func_direction_to_castling(-2));
    return array_of_possibilities;
};
// 
//



//
//
let func_rook_scourge_ready = function(){  // тура тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3]; 
        func_erect_motion(num, true);
    }}}
};
let func_rook_scourge_unready = function(){  // тура тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_erect_motion(num, false);
    }}}
};
let func_steed_scourge_ready = function(){  // конь тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_steed_motion(num,true);
    }}}
};
let func_steed_scourge_unready = function(){  // конь тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_steed_motion(num,false);
    }}}
};
let func_officer_scourge_ready = function(){  // офицер тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3]; 
        func_diagonal_motion(num, true);
    }}}
};
let func_officer_scourge_unready = function(){  // офицер тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3]; 
        func_diagonal_motion(num, false);
    }}}
};
let func_queen_scourge_ready = function(){  // королева тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_diagonal_motion(num, true);
        func_erect_motion(num, true);
    }}}
};
let func_queen_scourge_unready = function(){  // королева тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_diagonal_motion(num, false);
        func_erect_motion(num, false);
    }}}
};
let func_king_scourge_ready = function(){  // король тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, true);
    }}}
};
let func_king_scourge_unready = function(){  // король тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, false);
    }}}
};
let func_pawn_scourge_ready = function(){  // пешка тьмы 
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
    this.classList.add("ready_start");
    this.classList.add("can_pick");
    let num = +Array.from(this.parentElement.classList)[3];
    func_pawn_motion(num, true);
    }}}
};
let func_pawn_scourge_unready = function(){  // пешка тьмы
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
    this.classList.remove("ready_start");
    let num = +Array.from(this.parentElement.classList)[3];
    func_pawn_motion(num, false);
    }}}
};
let func_troll_scourge_ready = function(){  // троль тьмы 
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, true);
    }}}
};
let func_troll_scourge_unready = function(){  // троль тьмы 
    if(this!==window){
    if(motion===false && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, false);
    }}}
};
let func_empty_ready = function(){  // пусто + ТУТ РАССМАТРИВАЕТСЯ РОКИРОВКА
        if (this.classList.contains("ready_finish") ){ // если именно этот эмпти содержит класс реади финиш, то
        if (func_search_kings().children[0].classList.contains("ready_start") ){
        // if именно эта клетка под рокировку     
        // if номер имг отличается от номера короля на 20 в большую или меньшую сторону, ТО ... код ниже работает
        let kingS_old_position_num = +func_search_kings().classList[3];
        let kingS_new_position_num = +this.parentElement.classList[3];

        func_change_with_ready_start(this); // посколько motion флаг изменился из-за этой строки, то нид сохранять позиции короля до и после. После - вырезается из вырезаного емпти

        if( (kingS_old_position_num + 20 === kingS_new_position_num  )){ // случай рокировки вправо. Чекается бывший номер ячейки короля и настоящий
            console.log("рокировка right");
            let img = document.createElement('img');
            let start_num = kingS_new_position_num + 10;
            let finish_num = start_num - 20;
            let start = func_search_img_by_num(start_num);
            let finish = func_search_img_by_num(finish_num);
            finish.replaceWith(start);
            start.append(img);
            func_appointment_empty(img);
            finish.replaceWith(start);
            start.classList.remove("for_castling")
            func_search_element_by_num(start_num).append(img);
            func_appointment_empty(img);
        }
        if(kingS_old_position_num - 20 === kingS_new_position_num  ){ // случай рокировки влево. Чекается бывший номер ячейки короля и настоящий
            console.log("рокировка left");
            let img = document.createElement('img');
            let start_num = kingS_new_position_num - 20;
            let finish_num = start_num + 30;
            let start = func_search_img_by_num(start_num);
            let finish = func_search_img_by_num(finish_num);
            finish.replaceWith(start);
            start.classList.remove("for_castling")
            func_search_element_by_num(start_num).append(img);
            func_appointment_empty(img);
        }

        }else if(   func_search_replacement()?.children[0].classList.contains("pawn") && (this?.parentElement.classList[3][1]=== "1" ? true : this?.parentElement.classList[3][1]=== "8" )   ){ // случай превращения пешки при становлении на пустоту
            memory_for_conversion = +this?.parentElement.classList[3];
            func_conversion_pawn_into();
            console.log("тут превращение");
            func_change_with_ready_start(this);
        }else{ // случай перемещения на пустоту
            console.log("тут дефолт замена пешки на пустоту");
            func_change_with_ready_start(this);
        }
        }
        flag_pickup = false;
        func_remove_all_ready();
        if (flag_for_conversion===false){
            func_troubleshooting_for_king(); // need чтобы сбивался варик рокировки при ШАХе королю при наступлении на пустоту
        }
        
};
let func_pawn_sentinel_ready = function(){  // пешка света 
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
    this.classList.add("ready_start");
    this.classList.add("can_pick");
    let num = +Array.from(this.parentElement.classList)[3];
    func_pawn_motion(num, true);
    }}}
};
let func_pawn_sentinel_unready = function(){  // пешка света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
    this.classList.remove("ready_start");
    let num = +Array.from(this.parentElement.classList)[3];
    func_pawn_motion(num, false);
    }}}
};
let func_rook_sentinel_ready = function(){   // тура света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_erect_motion(num, true);
    }}}
};//gg
let func_rook_sentinel_unready = function(){   // тура света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_erect_motion(num, false);
    }}}
};
let func_steed_sentinel_ready = function(){  // конь света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_steed_motion(num,true);
    }}}
};
let func_steed_sentinel_unready = function(){  // конь света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_steed_motion(num,false);
    }}}
};
let func_officer_sentinel_ready = function(){  // офицер света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_diagonal_motion(num, true);
    }}}
};
let func_officer_sentinel_unready = function(){  // офицер света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_diagonal_motion(num, false);
    }}}
};
let func_queen_sentinel_ready = function(){  // королева света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3]; 
        func_diagonal_motion(num, true);
        func_erect_motion(num, true);
    }}}
};
let func_queen_sentinel_unready = function(){  // королева света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_diagonal_motion(num, false);
        func_erect_motion(num, false);
    }}}
};
let func_king_sentinel_ready = function(){   // король света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, true);
    }}}
};  
let func_king_sentinel_unready = function(){   // король света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, false);
    }}}
};  
let func_troll_sentinel_ready = function(){  // троль света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.add("ready_start");
        this.classList.add("can_pick");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, true);
    }}}
};
let func_troll_sentinel_unready = function(){  // троль света
    if(this!==window){
    if(motion===true && flag_for_conversion===false){
    if(!flag_pickup){
        this.classList.remove("ready_start");
        let num = +Array.from(this.parentElement.classList)[3];
        func_royal_move_motion(num, false);
    }}}
};
//
//


// на img!!! вешается класс фигуры, опасити класс, удаляется емпти класс (если нужно), вешаются события фигуры, вешаются уникальные классы для королей, руков и пешек
// функции назначения (присвоения) ячейке значения фигуры (или пустоты). x = сама картинка. события вешаются на картинки x
// Важно, что при отводе без клика, Еп слетает, а если нажать и отвести, то повесится флаг (самопитание) и поэтому не слетит Еп. 
let func_appointment_rook_scourge = function(x){
let y = func_rook_scourge_ready;
let z = func_rook_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/46.jpg");
x.classList.add("rook");
x.classList.add("scourge");
x.classList.add("for_castling");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_steed_scourge = function(x){
let y = func_steed_scourge_ready;
let z = func_steed_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/26.jpg");
x.classList.add("steed"); 
x.classList.add("scourge");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_officer_scourge = function(x){
let y = func_officer_scourge_ready;
let z = func_officer_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/13.jpg");
x.classList.add("officer");
x.classList.add("scourge");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_queen_scourge = function(x){
let y = func_queen_scourge_ready;
let z = func_queen_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/109.jpg");
x.classList.add("queen");
x.classList.add("scourge");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_king_scourge = function(x){
let y = func_king_scourge_ready;
let z = func_king_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/17.jpg");
x.classList.add("king");
x.classList.add("scourge");
x.classList.add("for_castling");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};//gg
let func_appointment_pawn_scourge = function(x){
    if(x.parentElement.classList[3][1]!==8){
let y = func_pawn_scourge_ready;
let z = func_pawn_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/105.jpg");
x.classList.add("pawn");
x.classList.add("scourge");
if(+x.parentElement.classList[3][1]===2){x.classList.add("pawn_first_step");}
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
    }
};
let func_appointment_empty = function(x){ 
let img = document.createElement('img');
//x.removeAttribute("src");       //удаление картинки
img.classList = [];
img.classList.add("empty");       //установка класса епти
func_opacity0(img);               //удаление класса опасити1 и установка классаопасити0
x.replaceWith(img);
img.addEventListener("click", func_empty_ready, false);   
};
let func_appointment_pawn_sentinel = function(x){
    if(x.parentElement.classList[3][1]!==1){
let y = func_pawn_sentinel_ready;
let z = func_pawn_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/111.jpg");
x.classList.add("pawn");
x.classList.add("sentinel");
if(+x.parentElement.classList[3][1]===7){x.classList.add("pawn_first_step");}
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
    }
};//gg
let func_appointment_rook_sentinel = function(x){
let y = func_rook_sentinel_ready;
let z = func_rook_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/1.jpg");
x.classList.add("rook");
x.classList.add("sentinel");
x.classList.add("for_castling");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_steed_sentinel = function(x){
let y = func_steed_sentinel_ready;
let z = func_steed_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/72.jpg");
x.classList.add("steed");
x.classList.add("sentinel");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_officer_sentinel = function(x){
let y = func_officer_sentinel_ready;
let z = func_officer_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/12.jpg");
x.classList.add("officer");
x.classList.add("sentinel");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_appointment_queen_sentinel = function(x){
let y = func_queen_sentinel_ready;
let z = func_queen_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/113.jpg");
x.classList.add("queen");
x.classList.add("sentinel");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};//gg
let func_appointment_king_sentinel = function(x){
let y = func_king_sentinel_ready;
let z = func_king_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/5.jpg");
x.classList.add("king");
x.classList.add("sentinel");
x.classList.add("for_castling");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};//gg
let func_appointment_troll_scourge = function(x){
let y = func_troll_scourge_ready;
let z = func_troll_scourge_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/5.jpg");
x.classList.add("troll");
x.classList.add("scourge");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};//gg
let func_appointment_troll_sentinel = function(x){
let y = func_troll_sentinel_ready;
let z = func_troll_sentinel_unready;
x.classList = [];
x.setAttribute("src", "./faces/for_project/5.jpg");
x.classList.add("troll");
x.classList.add("sentinel");
func_opacity1(x);
x.onclick = func_shell_ready(y);
x.onmouseover = y;
x.onmouseout = z;
};
let func_gen_promise = async function (x, y, i){
x(y);
i++;
return i;
};
document.body.addEventListener( "keydown", func_handler_conversion_pawn_into );
//
//


//
// для появления и исчезновения фигур - инициализация и не только
function AppearingFigures (){ // обнуляет и выставляет
    DisAppearingFigures();
    let i = 0;
    let j = class_x.children;
    func_gen_promise(func_appointment_rook_scourge, j[i].children[0],           i      ).then((i)=>{
    return func_gen_promise(func_appointment_steed_scourge, j[i].children[0],   i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_officer_scourge, j[i].children[0], i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_queen_scourge, j[i].children[0],   i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_king_scourge, j[i].children[0],    i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_officer_scourge, j[i].children[0], i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_steed_scourge, j[i].children[0],   i)  }  ).then((i)=>{
    return func_gen_promise(func_appointment_rook_scourge, j[i].children[0],    i)  }  ).then( async (i)=>{
    for (i;i<16;){                                                                                                                                                                      
    func_appointment_pawn_scourge(j[i].children[0]);                                                                                                                                       
    i++;
};                                                                                                          
    return i;                                                                                                         }  ).then( async (i)=>{
    for(i;i<48;){                                                                                                                                                                      
    func_appointment_empty(j[i].children[0]);                                                                                                                                                                 
    i++;
};                                                                                                          
    return i;                                                                                                         }  ).then( async (i)=>{
    for(i;i<56;){                                                                                                           
    func_appointment_pawn_sentinel(j[i].children[0]);                                                                                                                                     
    i++;
};                                                                                                                  
    return i;                                                                                                         }  ).then((i)=>{
    return func_gen_promise(func_appointment_rook_sentinel, j[i].children[0],    i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_steed_sentinel, j[i].children[0],   i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_officer_sentinel, j[i].children[0], i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_queen_sentinel, j[i].children[0],   i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_king_sentinel, j[i].children[0],    i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_officer_sentinel, j[i].children[0], i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_steed_sentinel, j[i].children[0],   i) }  ).then((i)=>{
    return func_gen_promise(func_appointment_rook_sentinel, j[i].children[0],    i) }  )
};
function DisAppearingFigures (){
    flag_pickup = false;
    motion = true;
    Array.from(class_x.children).forEach((item)=>{ // превращаю всех в эмпти, из-за этого на всех весит лисенер апоинтмента емпти, нужно удалить - это ниже в этой строке class_x.innerHTML = class_x.innerHTML;
        func_appointment_empty(item.children[0]);
    })
    class_x.innerHTML = class_x.innerHTML; // эта штука кикакет все события
    console.log("Кик доски");
};
//
//




let func_go_re = function(){ //эта функция крепится на кнопку событием рестарта матча
    let promise = new Promise ((resolve, reject) =>{  
    DisAppearingFigures();
    for_changes.style.display = 'none';
    notificationContainer.classList.remove('show_conversion');
    resolve();    // учтено, что после ре наступает ход белых !!!
});
promise.then(AppearingFigures);
};
let func_resignation_sentinel = function(){ //эта функция крепится на кнопку принятия поражения света
    alert("scourge WIN");
    DisAppearingFigures();
    for_changes.style.display = 'none';
};
let func_resignation_scourge = function(){ //эта функция крепится на кнопку принятия поражения тьмы
    alert("sentinel WIN"); 
    DisAppearingFigures();
    for_changes.style.display = 'none';
};


//
//
(function(){
    let go_re = document.querySelector(".go_re"),
    stalemate = document.querySelector(".stalemate"),
    resignation_sentinel = document.querySelector(".resignation_sentinel"),
    resignation_scourge = document.querySelector(".resignation_scourge");

    go_re.addEventListener("click", func_go_re, false); //центр справа
    stalemate.addEventListener("click", DisAppearingFigures, false); //слева снизу - ничья (для теста очистка доски)
    resignation_sentinel.addEventListener("click", func_resignation_sentinel, false); //свет сыглы на луз
    resignation_scourge.addEventListener("click", func_resignation_scourge, false); //тьма сыглы на луз
    AppearingFigures();
})();
//
//


const notificationParent = document.querySelector('.notification_container');
const messageBox = document.querySelector('.for_changes');

if (pawnNeedsConversion) {
    messageBox.innerText = 'Please press "Q" or "S" button to conversion pawn';
    notificationParent.classList.add('show_conversion');
} else {
    notificationParent.classList.remove('show_conversion');
}