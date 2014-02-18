dojo.require("esri.map");
dojo.require("esri.tasks.query");

var map,stlist,stListRd,stftSet,cWord,cChars,smb,errCnt,initExtent;

dojo.ready(function() {
    var options = {basemap:"national-geographic",center:[-70, -14],zoom:4};
    map = new esri.Map("map", options);
    dojo.connect(map, "onLoad", mapLoad);

    $('.keyboard li').click(function() {
        if(errCnt == 6) return;
        if(cChars.length!=0 && $.inArray($(this).text(),cChars) != -1) return;
        validadeRound(cChars.push($(this).html()));    
    });
    $('.nextRound').click(function() { nextRound(); });
    $('.restart').click(function() {
        startRound($('.results').addClass('hideOverlay'));
    });
});

function mapLoad() {
    initExtent = map.extent;
    smb = new esri.symbol.SimpleFillSymbol("solid", 
        new esri.symbol.SimpleLineSymbol("solid", 
        new dojo.Color([191,91,4,0.75]),2),new dojo.Color([191,91,4,0.75]));    
 
     $.ajax('source/estados_br.txt', {
        async: false,
        dataType: "json", 
        success: function(data) {
            stlist = new Array();
            stftSet = new esri.tasks.FeatureSet(data);
            for(var i = 0; i < stftSet.features.length; i++) 
                stlist.push(stftSet.features[i].attributes['TPQNOMNM']);           
            startRound();
        },
        error: function(jqXHR, textStatus, errorThrown ) {
            alert("Não foi possível ler os dados dos estados.");
        }
    });
  startRound();
}

function startRound() {  
    stListRd = $.shuffle(stlist.slice());
    nextRound();  
    $('.loadLbl').hide(); 
    $('.ginfo').show();
}

function nextRound() {
    errCnt = 0;
    addGraphics(stftSet.features, smb);
    drawWord(cWord = stListRd.shift().toUpperCase(),cChars = new Array());
    map.setExtent(initExtent);
    $("#mistakes").removeClass();
    $('#next').hide();
}

function validadeRound() {
    if(!hasChars(cWord, cChars)) {
        Error(); return;
    }

    drawWord(cWord, cChars); 
    addGraphics(getFeaturesByChars(cChars), smb);   
    
    if(!isWord(cWord)) return;
    var corretFeature = getFeatureByStateName(cWord.toUpperCase());
    addGraphics([corretFeature], smb); 
    map.setExtent(corretFeature.geometry.getExtent().expand(1.8));
    stListRd.length==0 ? $('#win').removeClass('hideOverlay'):$('#next').show();
}

function Error() {    
    cChars.pop();
    $('.answer').text(cWord);
    $("#mistakes").removeClass().addClass('hangman' + ++errCnt);    
    if(errCnt == 6) setTimeout(function() { $('#fail').removeClass('hideOverlay'); }, 1000);
}

function getFeatureByStateName(name) {
    for(var i=0; i < stftSet.features.length; i++)
        if(stftSet.features[i].attributes['TPQNOMNM'].toUpperCase() == name)
	        return stftSet.features[i];
}

function getFeaturesByChars(chars) {
    var ftList = new Array();
    dojo.forEach(stftSet.features, function(ft) {
        if(hasChars(ft.attributes['TPQNOMNM'],chars)) ftList.push(ft);
    }); 
    return ftList;
}

function hasChars(word, chList) {
    var result = word.match(RegExp('['+chList.join('+')+']','gi'));      
    if(result == null) return false;
    return result.filter(function(itm,i,a){ return i==a.indexOf(itm)}).length==chList.length;
}

function drawWord(word, c) {
    var charList = '';
    for(var i = 0, len = word.length; i < len; i++) {
        charList += '<li '+ (word[i] == ' ' ? 'class="space"':'') +'>'
        +($.inArray(word[i].toUpperCase(),c)==-1?'':word[i].toUpperCase())+'</li>';
    }; 
    $('#word').empty().html(charList);
}

function isWord(world) {
    var userWord = '';
    $('#word li').each(function() { userWord += $(this).html(); });
    return (userWord == world.toUpperCase().replace(/\s/g,''))
}

function addGraphics(src, symbol) {
    map.graphics.clear();
    for(var i=0;i<src.length;i++) 
        map.graphics.add(src[i].setSymbol(symbol));
}