/********************************
 * Chess Game
 * DEVELOPED BY nikos drosakis
 *
 * v.0.1 LAZY at 8 Sept2017
 * Browser chess with white user, black computer
 * 2 level intelligence moves and some tactics.
 * Chess rules roke and draw rules.
 * Potentials moves shown.
 * All data saved at Localstorage.
 */
function randomove(moves){return moves[Math.floor(Math.random()*moves.length)];}
function getkey(obj,val){for( var prop in obj) {if( obj.hasOwnProperty( prop ) ) {if( obj[ prop ] === val )return prop;}}}
function changeObjkey(obj,key,newkey,del){if(del==true) {delete obj[key];}else {Object.defineProperty(obj, newkey,Object.getOwnPropertyDescriptor(obj, key));delete obj[key];}return obj;}
(function(){
const local= {
            'get': function (name) {
                if (localStorage.getItem(name)) {
                    return localStorage.getItem(name);
                } else {
                    return false;
                }
            },
            'set': function (name, value) {
                localStorage.setItem(name, value);
            },
            'unset': function (name) {
                localStorage.removeItem(name);
            },
            'clear': function (name) {
                localStorage.clear();
            }
        };
const Chess = {		  
        /*********************
         BASIC VARS
         *********************/
        allseqs: function(){var se=[];for (var i =8; i > 0; i--) {for (var j in this.seq) {se.push(this.seq[j]+i);}}return se;},

        piecevalues: {pawn:1,knight:3,bishop:4,rook:5,queen:10,king:100},

        log: function(type,hint,ever){
            //turn
            if(type=='turn') {$('#turn').html(this.teamname[this.turn] + " turn").css('background',this.turn=='w'?'white':'black').css('color',this.turn=='w'?'black':'white');}

            //set gamelist
            var list='';for (var key in localStorage){
                if((key.includes("app_chess_") && key!='app_chess_gametag')) {
                    var tag= key.replace('app_chess_','')
                    list += '<button id="'+key+'" class="chessgamel" style="background:'+(local.get('app_chess_gametag')==tag ? '#4cae4c;':'bisque')+'">Game '+tag+'</button>';
                }
            };$('#chessgamelist').html(list);
            //clog
            if(type=='clog'){
                $('#gamelog').html(hint);
                if(ever!='ever'){setTimeout(function(){$('#gamelog').html('');}, ever);}
            }
        }, seq: ['a','b','c','d','e','f','g','h'],seqn: [1,2,3,4,5,6,7,8],

        activegame: true,
        mated: '',

        //letter to number
        lton: function(let){return parseInt(let.charCodeAt(0) - 97)},

        ntol: function(n){return String.fromCharCode(n+97)},

        makecheckboard : function(){var cbox='';for (var i =8; i > 0; i--) {for (var j in this.seq) {cbox += '<div class="cbox" id="'+this.seq[j]+i+'" style="background:' + ((j%2!=0 && i%2==0)||(j%2==0 && i%2!=0) ? '#ababab' : 'white') + '"><span class="boxcode">'+this.seq[j]+i+'</span></div>';}};$("#mainChessBoard").append(cbox);},

        gametag : local.get('app_chess_gametag')!=false ? parseInt(local.get('app_chess_gametag')) : 1,

        inipos: {w_rook:['a1','h1'],b_rook:['a8','h8'],w_knight:['b1','g1'],b_knight:['b8','g8'],w_bishop:['c1','f1'],b_bishop:['c8','f8'],w_queen:['d1'],b_queen:['d8'],w_king:['e1'],b_king:['e8'],w_pawn:['a2','b2','c2','d2','e2','f2','g2','h2'],b_pawn:['a7','b7','c7','d7','e7','f7','g7','h7']},

        iniset: function(){ for(var i in this.inipos) {var pos= this.inipos[i];for(var j in pos) {$("#"+pos[j]).html('<div class="'+i+'" id="pos_'+pos[j]+'" style="content:url(img/'+i+'.png)"></div>​');}}},

        turn: 'w',
        turnOp: function(){return this.turn=='w' ? 'b':'w'},

        teamname: {'w':"White's",'b':"Blacks's"},

        history: typeof(JSON.parse(local.get('app_chess_'+this.gametag))['history'])!='undefined'
            ? JSON.parse(local.get('app_chess_'+this.gametag))['history']:[],

        pieces: function(){return typeof(JSON.parse(local.get('app_chess_'+this.gametag))['pieces'])!='undefined' ? JSON.parse(local.get('app_chess_'+this.gametag))['pieces'] : {b:{},w:{}};},

        from: function(){return $(".cbox").hasClass("selbox")==false ? false : $('.selbox').attr('id')},

        pie: function(id){if(typeof($('#pos_'+id).attr('class'))!='undefined'){return $('#pos_'+id).attr('class').split('_')[1]}else{return false;}},

        piece: function(id){return $('#pos_'+id).attr('class');},
        //w or b
        team: function(id){if(typeof(this.piece(id))!='undefined'){return this.piece(id).split('_')[0]}},

        teamOpp: function(id){return this.team(id) == 'w' ? 'b' : 'w'},

        piecexist: function(to,from,opp){return $('#pos_' + to).length!=0 ? (!opp && !from ? true: (this.team(from)!=this.team(to) ? true: false)):false;},

        piecex: function(id){return $('#pos_' + id).length!=0 ? $('#pos_' + id).attr('class') :false;},

        setpiece: function(piece,from,to){
            $("#"+to).html('<div class="' + piece+ '" id="pos_'+to+'" style="content:url(img/' + piece + '.png)"></div>​');
            $("#pos_" + from).remove();
        },

        killpiece: function(piece,place){
            $('#pos_' + place).remove();
            $("#deadbox").append('<span class="' + piece+ ' captured" style="content:url(img/' + piece + '.png)"></span>​');
        },

        psposexist:function(team,to,pspos,opp,from){
            var teamOp=team=='w' ? 'b':'w';
            return !opp
                ? (team==null ? Object.keys(pspos['w']).includes(to) && Object.keys(pspos['b']).includes(to) : Object.keys(pspos[team]).includes(to))
                : Object.keys(pspos[team]).includes(to) && Object.keys(pspos[teamOp]).includes(from);
        },
        // pspiexist:function(team,to,pspos,pie){return pspos[team][to]==pie;},
        // kingpos : function(team){return $('.'+team+'_king').attr('id').replace('pos_','')},
        kingpos : function(team,pspos){return getkey(pspos[team],'king')},

        newpspos:function(mv,turn){
            var pspos = this.pieces();
            var turnl =!turn ? this.turn: turn;
            window['ps'+mv]={b:{},w:{}};
            //set new pieces pos
            var from = mv.split('-')[0];
            var to = mv.split('-')[1];
            window['ps'+mv].w= turnl=='w' ? changeObjkey(pspos.w,from,to) : (!this.psposexist('w',to,pspos,true,from) ? pspos.w : changeObjkey(pspos.w,to,'',true));
            window['ps'+mv].b= turnl=='b' ? changeObjkey(pspos.b,from,to) : (!this.psposexist('b',to,pspos,true,from) ? pspos.b : changeObjkey(pspos.b,to,'',true));
            return window['ps'+mv];
        },

        /********************
         SET and SAVE THE GAME
         *********************/
        save: function (){
            var array={pieces:{b:{},w:{}},killed:[]};
            array.turn= this.turn;
            array.mated= !this.activegame && this.mated!='' ? this.mated:'';
            array.fiftymoves= this.fiftymoves;
            $("#deadbox").children().map(function(){array.killed.push(this.className);});
            array.history= this.history;
            $("div[id^='pos_']").map(function() {
                var team= this.className.split('_')[0];
                var pie= this.className.split('_')[1];
                var pos= this.id.replace('pos_','');
                array.pieces[team][pos] = pie;
            });
            local.set('app_chess_'+this.gametag, JSON.stringify(array, null, 2));
        },

        setgame: function(tag){
            var saved= local.get('app_chess_'+tag);
            if(saved!=false){
                local.set('app_chess_gametag', tag);
                this.clearboard();
                var sg = JSON.parse(saved);
                for(var i in sg.pieces['b']){$("#"+i).html('<div class="b_'+sg["pieces"]['b'][i]+'" id="pos_'+i+'" style="content:url(img/b_'+sg["pieces"]['b'][i]+'.png)"></div>​');}
                for(var i in sg.pieces['w']){$("#"+i).html('<div class="w_'+sg["pieces"]['w'][i]+'" id="pos_'+i+'" style="content:url(img/w_'+sg["pieces"]['w'][i]+'.png)"></div>​');}
                if(sg.killed.length >0){for(var i in sg['killed']){$("#deadbox").append('<td class="'+sg["killed"][i]+' captured" style="content:url(img/'+sg["killed"][i]+'.png)"></td>')}}
                if(sg.history.length >0){for(var i in sg['history']){$('#hislabels').append('<td class="hisli'+(i%2==0 ? "W":"B")+'">'+sg["history"][i]+'</td>')}}
                this.turn = sg.turn;
                this.history = sg.history;
                this.pieces().b = sg.pieces['b'];
                this.pieces().w = sg.pieces['w'];
                this.fiftymoves = sg.fiftymoves;
                this.log('turn');
                if(sg['mated']=='') {
                    this.activegame=true;
                    this.log('clog','');
                }else{
                    this.mated= sg['mated'];
                    this.activegame=false;
                    this.fiftymoves= 0;
                    this.log('clog',"<b>"+this.teamname[sg['mated']]+" king is mated.</b>",'ever');
                }
            }else{
                this.newgame();
            }
        },

        setnewgametag : function(){
            var key = true; while(key){if(local.get('app_chess_'+this.gametag) == false) { key = false;}else{ this.gametag +=1;}}
            local.set('app_chess_gametag',this.gametag);
        },

        clearboard: function(){
            $("div[id^='pos_']").map(function() {$(this).remove();})
            $('.cbox').removeClass('potbox');
            $('.cbox').removeClass('selbox');
            $('.captured').remove();
            $('#chessgamehis ul').html('');
            $('.hisliW').remove();
            $('.hisliB').remove();
        },

        newgame: function(){
            this.clearboard();
            this.iniset();
            this.setnewgametag();
            this.activegame=true;
            this.mated='';
            this.turn='w';
            this.history=[];
            this.save();
            this.log('turn');
            this.log('clog','');
        },

        /*********************
         RULES
         *********************/
        /***MOVE RULES****/
        movealgo: function(from,step,type) {
            step=step+1;
            var lton0= this.lton(from[0]);
            var from1= parseInt(from[1]);
            //linear
            if(type=='linear') {
                return [
                    this.ntol(lton0 + step) + from[1],
                    this.ntol(lton0 - step) + from[1],
                    from[0] + (from1 + step),
                    from[0] + (from1 - step)
                ];
            }else if (type=='diagonal') {
                //diagonal
                return [
                    this.ntol(lton0 + step) + (from1+step),
                    this.ntol(lton0 - step) + (from1-step),
                    this.ntol(lton0 + step) + (from1-step),
                    this.ntol(lton0 - step) + (from1+step)
                ];
            }else if (type=='all') {
                return [
                    this.ntol(lton0 + step) + from[1],
                    this.ntol(lton0 - step) + from[1],
                    from[0] + (from1 + step),
                    from[0] + (from1 - step),
                    this.ntol(lton0 + step) + (from1+step),
                    this.ntol(lton0 - step) + (from1-step),
                    this.ntol(lton0 + step) + (from1-step),
                    this.ntol(lton0 - step) + (from1+step)
                ];
            }else if (type=='knight') {
                return [
                    this.ntol(lton0 + 2) + (from1+1),
                    this.ntol(lton0 - 2) + (from1+1),
                    this.ntol(lton0 + 2) + (from1-1),
                    this.ntol(lton0 - 2) + (from1-1),
                    this.ntol(lton0 + 1) + (from1+2),
                    this.ntol(lton0 - 1) + (from1+2),
                    this.ntol(lton0 + 1) + (from1-2),
                    this.ntol(lton0 - 1) + (from1-2)
                ];
            }
        },

        attackown : function(from,to,pspos){
            // if(this.team(from)==this.team(to)){return true;}else{return false;}
            if(this.psposexist('w',to,pspos) && this.psposexist('w',from,pspos) ||
                this.psposexist('b',to,pspos) && this.psposexist('b',from,pspos)
            ){return true;}else{return false;}
        },

        noback : function(from,to,pspos){
            var from1=parseInt(from[1]);
            var to1=parseInt(to[1]);
            return pspos['w'][from]=='pawn' || pspos['b'][from]=='pawn'
                ? (this.psposexist('w',from,pspos) && to1 - from1 > 0  ? true : (this.psposexist('b',from,pspos) && to1 - from1 < 0 ? true :false))
                :true;
        },

        pawnmove: function(from,to,pspos){
            var from1=parseInt(from[1]);var to1=parseInt(to[1]);
            if(pspos['w'][from]=='pawn' || pspos['b'][from]=='pawn'){
                if((from[0]==to[0] && !this.psposexist(this.turnOp(),to,pspos,true,from))
                    || (Math.abs(this.lton(from[0])-this.lton(to[0]))==1 && (this.psposexist('w',to,pspos,true,from) || this.psposexist('b',to,pspos,true,from)) )){
                    return true;}else{return false;}}else{return true;}
        },

        pawnqueen:function(id){
            if(this.pie(id)=='pawn'){
                var team= this.team(id);
                if((team=='w' && id[1]==8) || (team=='b' && id[1]==1)){
                    $('#pos_'+id).remove();
                    $('#'+id).html('<div class="'+team+'_queen" id="pos_'+id+'" style="content:url(img/'+team+'_queen.png)"></div>');
                }
            }
        },

        roke:function(){},

        /***WIN RULES****/
        mat: function(team){
            this.activegame=false;
            this.mated=team;
            this.log('clog',"<b>"+this.teamname[team]+" king is mated.</b>",'ever');
        },

        draw: function(){
            this.activegame=false;
            this.mated='d';
            this.log('clog',"<b>Game is a draw.</b>",'ever');
        },

        check: function(team){this.log('clog',"<b>"+this.teamname[team]+" king is checked.</b>",'ever');},

        checked: function(team,pspos){
            var teamOp= team=='w' ? 'b' :'w';
            //if whites moves includes b king ie black is checked

            var bestmove = this.bestmove();

            //if king is threated
            if (this.allobox(teamOp,false,pspos).includes(this.kingpos(team,pspos))){
                //teamOp whites
                //team blacks
                if(!bestmove){
                    this.mat(team);
                    return 'mated';
                }else {
                    var newpspos = this.newpspos(bestmove, pspos);
                    //if after best black move still in check then mat else check

                    if (this.allobox(team, false, newpspos).includes(this.kingpos(teamOp, newpspos)) == false) {
                        this.check(team);
                        return 'checked';
                    } else {
                        this.mat(team);
                        return 'mated';
                    }
                }
            }else {
                if (!bestmove || this.fiftymoves == 50) {
                    this.draw();
                } else {
                    return false;
                }
            }
        },

        /***DRAW RULES****/
        fiftymoves: 0,

        stalemate:function(){
            //king not in check but nomove
        },

        movepiece: function(move){
            // if(!move && !this.checked(this.turn,this.pieces())) {
            //     this.draw();
            // }else if(!move){
            //     this.mat(this.turn);

            // }else{
            var from = move.split('-')[0];
            var to = move.split('-')[1];
            var pie = $('#pos_' + from).attr('class').split('_')[1];

            if (this.piecexist(to, from, true)) {
                var killed = $('#pos_' + to).attr('class');
                this.killpiece(killed, to);
                this.fiftymoves=0;
            }else {
                if(pie=='pawn') {this.fiftymoves = 0;}else{this.fiftymoves += 1;}
            }
            this.setpiece(this.piece(from), from, to);
            this.pawnqueen(to);
            this.history.push(move);
            $('#hislabels').append('<td class="hisli' + (this.turn == 'b' ? "B" : "W") + '">' + move + '</td>');
            this.turn = this.teamOpp(to);
            this.log('turn');
            var turnOpp = _.turn == 'w' ? 'b' : 'w';
            // }
            this.save();
        },

        /*************************
         INIT FUNCTION AND CORE FUNCTIONS
         OBOX is moves of each piece. It is consisted by MOVEALGO and filtered by FILTEROBOX && MOVE RULES
         ALLOBOX is moves of all pieces (obox of all team pieces)
         POTENTIAL gives potential moves for WHITES (user) preventing rules of mate
         *************************/
        init: function () {
            // this.makecheckboard();
            this.setgame(this.gametag);
            if (this.activegame == true) {
                this.log('turn');
                //computer plays
                if (this.turn == 'b') {
                    var move = this.bestmove();
                    this.movepiece(move);
                    console.log(move)
                }
                this.checked('b', this.pieces());
                this.checked('w', this.pieces());
            }
            if(this.activegame==true && this.mated=='') {
                $('.cbox').click(function () {
                    if (_.turn == 'w') {
                        var from = _.from();
                        if (from != false) {
                            // var obox = _.obox(from, _.pie(from), false, _.pieces());
                            // if (obox.includes(this.id)) {
                            if (_.potential(from).includes(this.id)) {
                                _.movepiece(from + '-' + this.id);
                                _.checked('b', _.pieces());
                            } else {
                                _.log('clog', 'This movement is not allowed.', 3000);
                            }
                            $('.cbox').removeClass('potbox').removeClass('selbox');
                        } else {
                            if (_.team(this.id) == _.turn) {
                                _.select(this.id);
                            } else {
                                _.log('clog', 'This is not your turn.', 3000);
                            }
                        }
                    }
                    if (_.turn == 'b') {
                        var move = _.bestmove();
                        console.log(move)
                        _.movepiece(move);
                        _.checked('w', _.pieces());
                    }
                })
            }
            $(document).on("click",'#newgame',function(){_.newgame();})

            $(document).on("click","button[id^='app_chess_']",function(){var tag= this.id.replace('app_chess_','');_.setgame(tag);})
        },

        filteobox: function(from,to,pspos){
            var all= this.allseqs();
            return all.includes(to)     //ok
            && !this.attackown(from, to,pspos) //ok
            && this.noback(from,to,pspos)     //ok
            && this.pawnmove(from,to,pspos)   //ok
                ? true: false;
        },

        obox: function(from,pie,returnmove,pspos){
            // var pspos1 = !pspos ? this.pieces() : pspos;
            var steps= pie=='bishop' || pie=='rook' || pie=='queen' ? 8 : (pie=='pawn' && ['2','7'].includes(from[1]) ? 2 : 1);
            var movetype= pie=='bishop' ? 'diagonal' : (pie=='rook' ? 'linear' : (pie=='knight' ? 'knight' : 'all'));
            var road=[],step=0;cutoff=[],attacked=[];
            while(step < steps){
                var limit= step==0 ? steps : road.length;
                for(var i=0;i<this.movealgo(from, step,movetype).length;i++) {
                    if (!cutoff.includes(i) && !attacked.includes(i)) {
                        var to = this.movealgo(from, step,movetype)[i];
                        if (this.filteobox(from, to,pspos)) {
                            if(step==0){road[i]=[];}
                            road[i][step] = to;
                            var team= this.team(from)=='b'?'w':'b';
                            if(this.psposexist(team,to,pspos,true,from)){attacked.push(i);} //jumbing forbidden
                        } else {
                            cutoff.push(i);
                        }
                    }
                }step++;
            }
            // road = road.filter(function(){return true;});
            var froad=[];
            for(var i in road){
                for (var j in road[i]){
                    if(returnmove){froad.push(from+'-'+road[i][j]);}else {froad.push(road[i][j]);}
                }}
            return froad;
        },

        allobox: function(team,returnmove,pspos){
            var allbx=[];for(var i in pspos[team]){
                var obox= returnmove ? this.obox(i,pspos[team][i],true,pspos) : this.obox(i,pspos[team][i],false,pspos);
                if(obox.length >0) {
                    for(var j in obox){
                        allbx.push(obox[j]);
                    }}}
            return returnmove ? allbx : $.unique(allbx);
        },

        potential: function(from){
            var pots=[];
            var obox= this.obox(from,this.pie(from),false,this.pieces());
            for(var i in obox){
                var newpspos= this.newpspos(from+"-"+obox[i]);
                if (this.allobox('b',false,newpspos).includes(this.kingpos('w',newpspos))==false){
                    pots.push(obox[i]);
                }}
            return pots;
        },

        select: function(id){
            if (this.piecexist(id)) {
                $('.cbox').removeClass('selbox');
                $('#' + id).addClass('selbox');
                $('.cbox').removeClass('potbox');
                var pots= _.potential(id);
                for (var i in pots){
                    $('#'+pots[i]).addClass('potbox');
                }
            }
        },

        /*************************
         BLACKS INTELLIGENCE
         **************************/
        /*******
         TACTICS
         *******/
        attack_king:function(){},

        opening_pawns: function (mvs) {
            var arr=[];
            for (var i in mvs) {
                arr.push(mvs[i].split('-')[0])
            }
            var pawns = ['b7', 'c7', 'd7', 'e7', 'f7'];
            var counter = 0;
            for (var i in pawns) {
                if (this.pie(pawns[i])=='pawn' && arr.includes(pawns[i])) {counter += 1;}
            }
            if (counter >= 2) {return mvs[arr.indexOf(randomove(pawns))];} else {return false;}
        },

        create_pawnqueen:function(){},

        prevent_pawnqueen:function(){},
        /*******
         MOVE ALGOS
         BESTMOVE users minimax method to decide which is the topmoves.
         Topmoves are filtered by TACTICS.
         BESTMOVETREE (object of all moves with piecevalues at each brunch
         bestmovealgo gives move value at ALLOBOX moves at all move levels (level1 [black moves] && level2 [white reply move])
         *******/
        bestmovealgo:function(moves,team,pspos,previouscore){
            var scor=0,ar={};
            var teamOp=team=='w'?'b':'w';
            for(var i in moves){
                var to= moves[i].split('-')[1];
                scor = this.psposexist(teamOp, to,pspos) ? this.piecevalues[pspos[teamOp][to]] : 0;
                ar[moves[i]] = previouscore != null ? previouscore - scor : scor;
            }return ar;
        },

        bestmovetree: function(){
            //current pos
            var moves= this.allobox(this.turn,true,this.pieces());
            var mos= this.bestmovealgo(moves,this.turn,this.pieces(),null);
            var mos2={};
            for (var i in mos){
                var newpspos= this.newpspos(i);
                //run algo
                var movs= this.allobox(this.turnOp(),true,newpspos);
                mos2[i] = this.bestmovealgo(movs, this.turnOp(), newpspos, mos[i]);
            }return mos2;
        },

        bestmove:function(){ //2 level
            var minimax={},mini=[];
            var tree= this.bestmovetree();
            console.log(tree)
            //min
            for(var i in tree){
                mini[i]=999;                
                for(var j in tree[i]){
                    if(mini[i] > tree[i][j]){mini[i]=tree[i][j];minimax[i]=mini[i];}
                }
            }
            //max
            console.log(minimax)
            var max=-999,topmoves=[];
            for(var j in minimax){
                if(minimax[j] > -91) {
                    if (max <= minimax[j]) {
                        max = minimax[j];
                        topmoves.push(j);
                    }
                }
            }
            // console.log(topmoves)
            var opening = this.opening_pawns(topmoves);
            return topmoves.length > 0 ? (!opening ? randomove(topmoves): opening) :false;
        },
    }    
    var _= Chess;
    _.init();
})();	
